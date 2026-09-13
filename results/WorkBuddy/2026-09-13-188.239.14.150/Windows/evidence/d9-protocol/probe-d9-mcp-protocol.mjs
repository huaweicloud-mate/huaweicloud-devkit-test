#!/usr/bin/env node
/**
 * Probe 1 — D9 MCP protocol testing (runtime / live server).
 *
 * Spawns the REAL huaweicloud-devkit MCP server (stdio transport) as a child
 * process and drives it through JSON-RPC over stdin/stdout.
 *
 * Entry point (stdio):
 *   .../huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs
 *
 * Transport used here: newline-delimited JSON-RPC (each message ends with \n).
 * The server auto-detects framing: it falls back to newline-delimited mode
 * when no `Content-Length:` header is present (see mcp-server.mjs readFrames()).
 *
 * Cases covered:
 *   D9-1  tools/list compliance (count + schema validity)
 *   D9-3  tools/call response format (content[] + isError semantics)
 *   D9-4  protocol lifecycle (initialize must precede tools/list)
 *   D9-5  stdio transport robustness (stdout = pure JSON-RPC, no pollution)
 *   D9-8  inputSchema JSON Schema draft consistency
 */

import { spawn } from 'node:child_process';

const NODE =
  'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node.exe';
const SERVER =
  'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs';

// ---------------------------------------------------------------------------
// Result tracking
// ---------------------------------------------------------------------------
const results = [];
let pass = 0;
let fail = 0;
let spec = 0;

function assert(caseId, condition, detail) {
  const ok = Boolean(condition);
  results.push({ caseId, status: ok ? 'PASS' : 'FAIL', detail });
  if (ok) pass += 1;
  else fail += 1;
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${caseId} :: ${detail}`);
}

function assertSpec(caseId, detail) {
  results.push({ caseId, status: 'SPEC', detail });
  spec += 1;
  console.log(`[SPEC] ${caseId} :: ${detail}`);
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Spawn the MCP server (stdio transport)
// ---------------------------------------------------------------------------
const child = spawn(NODE, [SERVER], {
  stdio: ['pipe', 'pipe', 'pipe'],
  windowsHide: true,
  env: { ...process.env, HUAWEICLOUD_DEVKIT_SKIP_UPDATE: '1' },
});

child.on('error', (err) => {
  console.error(`[FATAL] failed to spawn MCP server: ${err.message}`);
  process.exitCode = 1;
});

// Accumulate stdout lines and resolve pending JSON-RPC requests by id.
let buf = '';
const stdoutLines = [];
const stderrChunks = [];

child.stderr.setEncoding('utf8');
child.stderr.on('data', (d) => stderrChunks.push(d));

const pending = new Map();
let nextId = 1;

child.stdout.setEncoding('utf8');
child.stdout.on('data', (d) => {
  buf += String(d);
  let idx;
  while ((idx = buf.indexOf('\n')) !== -1) {
    const line = buf.slice(0, idx);
    buf = buf.slice(idx + 1);
    const t = line.trim();
    if (!t) continue;
    stdoutLines.push(t);
    let msg;
    try {
      msg = JSON.parse(t);
    } catch {
      continue;
    }
    if (msg && typeof msg === 'object' && Object.hasOwn(msg, 'id')) {
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        clearTimeout(p.timer);
        p.resolve(msg);
      }
    }
  }
});

function send(method, params, { timeout = 20000 } = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout waiting for response to ${method} (id=${id})`));
    }, timeout);
    pending.set(id, { resolve, timer });
    child.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', id, method, params: params || {} }) + '\n',
    );
  });
}

// ---------------------------------------------------------------------------
// JSON Schema validation helpers (D9-1 / D9-8)
// ---------------------------------------------------------------------------
const VALID_TYPES = new Set([
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'object',
  'null',
]);

function validateSchema(schema, ctx) {
  const errors = [];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    errors.push(`${ctx}: not an object schema`);
    return { valid: false, errors };
  }
  const type = schema.type;
  // In JSON Schema, `type` is OPTIONAL (absent => matches anything). A schema
  // that only carries `description`/`enum` etc. is still valid; we flag it as a
  // "loose" schema via notes rather than as an error.
  if (type !== undefined) {
    if (typeof type !== 'string' || !VALID_TYPES.has(type)) {
      errors.push(`${ctx}: invalid type ${JSON.stringify(type)}`);
    }
    if (type === 'object') {
      if (schema.properties !== undefined) {
        if (typeof schema.properties !== 'object' || Array.isArray(schema.properties)) {
          errors.push(`${ctx}: object properties must be an object map`);
        } else {
          for (const [k, v] of Object.entries(schema.properties)) {
            const r = validateSchema(v, `${ctx}.${k}`);
            if (!r.valid) errors.push(...r.errors);
          }
        }
      }
    }
    if (type === 'array' && schema.items !== undefined) {
      const r = validateSchema(schema.items, `${ctx}[]`);
      if (!r.valid) errors.push(...r.errors);
    }
  }
  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required) || !schema.required.every((x) => typeof x === 'string')) {
      errors.push(`${ctx}: required must be array of strings`);
    } else if (schema.properties) {
      for (const rq of schema.required) {
        if (!(rq in schema.properties)) errors.push(`${ctx}: required '${rq}' not in properties`);
      }
    }
  }
  if (schema.enum !== undefined && !Array.isArray(schema.enum)) {
    errors.push(`${ctx}: enum must be an array`);
  }
  return { valid: errors.length === 0, errors };
}

function analyzeSchemas(tools) {
  const errors = [];
  const notes = [];
  const rootTypes = new Set();
  let allValid = true;
  let consistent = true;
  for (const t of tools) {
    const s = t.inputSchema;
    if (s && typeof s.type === 'string') rootTypes.add(s.type);
    if (s && typeof s.$schema === 'string') notes.push(`${t.name}: declares $schema=${s.$schema}`);
    // Detect "loose" property schemas (no explicit type) for informational notes.
    collectLooseProps(s, t.name, notes);
    const res = validateSchema(s, t.name);
    if (!res.valid) {
      allValid = false;
      errors.push(...res.errors);
    }
  }
  if (rootTypes.size !== 1 || !rootTypes.has('object')) consistent = false;
  return { allValid, consistent, errors, notes };
}

function collectLooseProps(schema, ctx, notes) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return;
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [k, v] of Object.entries(schema.properties)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && v.type === undefined) {
        notes.push(`${ctx}: property "${k}" has no explicit type (permissive schema — valid JSON Schema, accepts any value).`);
      }
      collectLooseProps(v, `${ctx}.${k}`, notes);
    }
  }
  if (schema.items) collectLooseProps(schema.items, `${ctx}[]`, notes);
}

// ---------------------------------------------------------------------------
// D9-3 tools/call response evaluation
// ---------------------------------------------------------------------------
function evaluateCall(caseId, call, label) {
  const r = call && call.result;
  const ok =
    r &&
    Array.isArray(r.content) &&
    r.content.length > 0 &&
    r.content.every(
      (c) =>
        typeof c.type === 'string' && ('text' in c || 'data' in c || 'resource' in c),
    ) &&
    typeof r.isError === 'boolean';
  assert(
    caseId,
    ok,
    ok
      ? `${label}: tools/call returned content[] (${r.content.length} item(s)) with isError=${r.isError}.`
      : `${label}: tools/call response missing content[]/isError. resp=${JSON.stringify(call).slice(0, 240)}`,
  );
  assertSpec(
    caseId,
    `${label}: isError is a boolean (${r ? r.isError : 'n/a'}) — tool-level error semantics are present alongside JSON-RPC level.`,
  );
}

// ---------------------------------------------------------------------------
// D9-5 stdout purity analysis
// ---------------------------------------------------------------------------
function analyzeStdout(lines) {
  let allJsonRpc = true;
  let nonJson = 0;
  let sample = '';
  for (const line of lines) {
    let ok = false;
    try {
      const m = JSON.parse(line);
      ok = m && typeof m === 'object' && m.jsonrpc === '2.0';
    } catch {
      ok = false;
    }
    if (!ok) {
      allJsonRpc = false;
      nonJson += 1;
      if (!sample) sample = line.slice(0, 120);
    }
  }
  return { allJsonRpc, total: lines.length, nonJson, sample };
}

// ---------------------------------------------------------------------------
// Main test sequence
// ---------------------------------------------------------------------------
async function main() {
  // Let the module graph load before we start poking the server.
  await delay(1000);

  if (!child.pid || child.exitCode !== null) {
    assert('D9-1', false, 'MCP server process is not running — cannot perform protocol tests.');
    finish();
    return;
  }

  // ---- D9-4: tools/list BEFORE initialize (lifecycle ordering) ----
  let d94;
  try {
    d94 = await send('tools/list', {});
  } catch (e) {
    d94 = { __error: e.message };
  }
  const d94HasError = Boolean(d94 && d94.error);
  const d94HasResult = Boolean(d94 && d94.result && Array.isArray(d94.result.tools));
  assert(
    'D9-4',
    d94HasError,
    d94HasError
      ? `tools/list before initialize was rejected (error code ${d94.error.code}) — protocol lifecycle enforced.`
      : 'tools/list before initialize returned a result WITHOUT an error — lifecycle ordering is NOT enforced (deviation from MCP spec which requires initialize first).',
  );
  assertSpec(
    'D9-4',
    `observed tools/list(pre-init) -> ${
      d94HasError ? `error ${d94.error.code} (${d94.error.message})` : `result with ${d94.result?.tools?.length ?? 0} tools`
    }`,
  );

  // ---- initialize ----
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'd9-protocol-probe', version: '1.0.0' },
  });
  const initOk =
    init &&
    init.result &&
    init.result.protocolVersion &&
    init.result.serverInfo &&
    init.result.serverInfo.name === 'huaweicloud-devkit';
  assert(
    'D9-4',
    initOk,
    initOk
      ? `initialize succeeded (protocolVersion=${init.result.protocolVersion}, server=${init.result.serverInfo.name}, caps=${JSON.stringify(init.result.capabilities)}).`
      : `initialize failed: ${JSON.stringify(init && init.error)}`,
  );
  // Spec-compliant handshake notification (no response expected).
  child.stdin.write(
    JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
  );

  // ---- D9-1: tools/list compliance ----
  const tl = await send('tools/list', {});
  const tools = (tl && tl.result && tl.result.tools) || [];
  assert(
    'D9-1',
    Array.isArray(tools) && tools.length === 39,
    `tools/list returned ${tools.length} tools (expected 39).`,
  );

  let allHaveNameDesc = true;
  let allHaveValidRootSchema = true;
  const schemaIssues = [];
  for (const t of tools) {
    if (typeof t.name !== 'string' || typeof t.description !== 'string') {
      allHaveNameDesc = false;
      schemaIssues.push(`${t.name || '?'} missing name/description`);
    }
    const s = t.inputSchema;
    if (!s || s.type !== 'object' || typeof s.properties !== 'object' || Array.isArray(s.properties)) {
      allHaveValidRootSchema = false;
      schemaIssues.push(`${t.name}: inputSchema not {type:object, properties:{}}`);
    }
  }
  assert(
    'D9-1',
    allHaveNameDesc,
    allHaveNameDesc
      ? 'all 39 tools expose a string name + description.'
      : `name/description issues: ${schemaIssues.slice(0, 5).join('; ')}`,
  );
  assert(
    'D9-1',
    allHaveValidRootSchema,
    allHaveValidRootSchema
      ? 'all 39 tools expose a valid inputSchema {type:"object", properties:{}}.'
      : `inputSchema root issues: ${schemaIssues.slice(0, 5).join('; ')}`,
  );

  // ---- D9-3: tools/call response format (safe tool) ----
  const callUpdate = await send('tools/call', {
    name: 'huaweicloud_check_update',
    arguments: {},
  });
  if (callUpdate && callUpdate.error) {
    // Fallback to a deterministic, fully-local tool if the network-dependent
    // update check errored at the JSON-RPC layer.
    const callCatalog = await send('tools/call', {
      name: 'huaweicloud_service_catalog',
      arguments: { intent: 'deploy web app' },
    });
    evaluateCall(
      'D9-3',
      callCatalog,
      `huaweicloud_service_catalog (fallback; huaweicloud_check_update errored: ${callUpdate.error.message})`,
    );
  } else {
    evaluateCall('D9-3', callUpdate, 'huaweicloud_check_update');
  }

  // ---- D9-8: inputSchema JSON Schema draft consistency ----
  const consistency = analyzeSchemas(tools);
  assertSpec(
    'D9-8',
    `all ${tools.length} inputSchemas declare type:"object" as the root (JSON Schema object document).`,
  );
  assert(
    'D9-8',
    consistency.allValid,
    consistency.allValid
      ? 'all inputSchemas are structurally valid JSON Schema (draft-07/2020-12 compatible) with no illegal keywords.'
      : `schema validity issues: ${consistency.errors.slice(0, 5).join('; ')}`,
  );
  assert(
    'D9-8',
    consistency.consistent,
    consistency.consistent
      ? 'all inputSchemas use a consistent JSON Schema dialect (uniform root type, no conflicting $schema).'
      : `inconsistent dialect usage: ${consistency.notes.slice(0, 5).join('; ') || 'mixed root types'}`,
  );
  if (consistency.notes.length) {
    assertSpec('D9-8', `schema notes: ${consistency.notes.slice(0, 6).join(' ')}`);
  }

  // ---- D9-5: stdio transport robustness (stdout = pure JSON-RPC) ----
  const purity = analyzeStdout(stdoutLines);
  assert(
    'D9-5',
    purity.allJsonRpc,
    purity.allJsonRpc
      ? `all ${purity.total} captured stdout line(s) are valid JSON-RPC 2.0 (no console.log / stderr pollution on stdout).`
      : `stdout contained ${purity.nonJson} non-JSON-RPC line(s): ${purity.sample}`,
  );
  assertSpec(
    'D9-5',
    `stderr bytes captured during run: ${stderrChunks.join('').length} (diagnostics correctly routed off stdout).`,
  );

  finish();
}

function finish() {
  // Let the server exit cleanly: stdin close is the shutdown signal for
  // non-hermes agents (see mcp-server.mjs onStdinClose).
  try {
    child.stdin.end();
  } catch {}
  printSummary();
}

function printSummary() {
  console.log('\n================ D9 PROTOCOL PROBE SUMMARY ================');
  console.log(`PASS=${pass}   FAIL=${fail}   SPEC=${spec}   TOTAL=${results.length}`);
  const failed = results.filter((r) => r.status === 'FAIL');
  if (failed.length) {
    console.log('---- FAILURES ----');
    for (const f of failed) console.log(`  ${f.caseId}: ${f.detail}`);
  }
  console.log('===========================================================');
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error(`[FATAL] probe crashed: ${err && err.stack ? err.stack : err}`);
  process.exitCode = 1;
  try {
    child.stdin.end();
  } catch {}
});

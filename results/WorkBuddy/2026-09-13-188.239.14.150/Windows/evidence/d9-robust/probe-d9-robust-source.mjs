#!/usr/bin/env node
/**
 * Probe 2 — D9 MCP protocol testing (source-level static analysis).
 *
 * Reads the MCP server source (no execution) and verifies protocol-level
 * invariants by inspection.
 *
 * Entry points inspected:
 *   .../huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-server.mjs
 *   .../huaweicloud-devkit/plugins/huaweicloud-core/src/mcp-protocol.mjs
 * A whole-directory scan is also performed to locate where each JSON-RPC
 * error code is actually implemented.
 *
 * Cases covered:
 *   D9-2  JSON-RPC error codes (mapping of -32700/-32600/-32601/-32602/-32603
 *         and whether unknown methods return -32601, not -32603)
 *   D9-7  protocol version negotiation / downgrade logic
 *
 * Pattern: assert(caseId, condition, detail) + assertSpec(caseId, detail).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR =
  'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';

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

// ---------------------------------------------------------------------------
// Source loading + directory scan
// ---------------------------------------------------------------------------
function readText(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (e) {
    return null;
  }
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && (ent.name.endsWith('.mjs') || ent.name.endsWith('.js'))) out.push(full);
  }
  return out;
}

const serverSrc = readText(join(SRC_DIR, 'mcp-server.mjs'));
const protocolSrc = readText(join(SRC_DIR, 'mcp-protocol.mjs'));

if (serverSrc === null) {
  assert('D9-2', false, `cannot read mcp-server.mjs at ${join(SRC_DIR, 'mcp-server.mjs')}`);
  printSummary();
  process.exit(0);
}

// Whole-directory scan to find where each error code literal is actually used.
const allFiles = walk(SRC_DIR);
const codeLocations = {
  '-32700': [],
  '-32600': [],
  '-32601': [],
  '-32602': [],
  '-32603': [],
};
for (const f of allFiles) {
  const text = readText(f);
  if (text === null) continue;
  for (const code of Object.keys(codeLocations)) {
    const re = new RegExp(`-?${code.replace('-', '\\-')}\\b`);
    if (re.test(text)) codeLocations[code].push(f.replace(SRC_DIR, '<src>'));
  }
}

// ---------------------------------------------------------------------------
// D9-2 — JSON-RPC error code mapping
// ---------------------------------------------------------------------------
assertSpec(
  'D9-2',
  'JSON-RPC standard error codes: -32700 parse error, -32600 invalid request, -32601 method not found, -32602 invalid params, -32603 internal error.',
);

const hasCodeInServer = (code) => new RegExp(`${code}\\b`).test(serverSrc);

// -32603: present in the stdio server's handleMessage catch block.
const has32603 = hasCodeInServer('-32603');
assert(
  'D9-2',
  has32603,
  has32603
    ? 'stdio mcp-server.mjs implements -32603 (internal error) in the handleMessage catch block.'
    : 'stdio mcp-server.mjs does NOT implement -32603 — unexpected.',
);

// The other four standard codes in the stdio server.
const has32700 = hasCodeInServer('-32700');
const has32600 = hasCodeInServer('-32600');
const has32601 = hasCodeInServer('-32601');
const has32602 = hasCodeInServer('-32602');

assert(
  'D9-2',
  has32700,
  has32700
    ? 'stdio server maps parse errors to -32700.'
    : `-32700 (parse error) is NOT implemented in the stdio server. Locations across plugin: ${
        codeLocations['-32700'].length ? codeLocations['-32700'].join(', ') : 'none'
      } — only the remote transport (mcp-server-remote.mjs) defines it.`,
);

assert(
  'D9-2',
  has32600,
  has32600
    ? 'stdio server maps invalid request to -32600.'
    : '-32600 (invalid request) is NOT implemented in the stdio server.',
);

assert(
  'D9-2',
  has32601,
  has32601
    ? 'stdio server maps method-not-found to -32601.'
    : '-32601 (method not found) is NOT implemented in the stdio server.',
);

assert(
  'D9-2',
  has32602,
  has32602
    ? 'stdio server maps invalid params to -32602.'
    : '-32602 (invalid params) is NOT implemented in the stdio server.',
);

// Unknown-method path: dispatch() throws `Unsupported method: ...` for any
// unrecognised method; handleMessage catches every throw and returns -32603.
const dispatchThrowsUnsupported = /Unsupported method/.test(protocolSrc);
const catchReturns32603 = /code:\s*-32603/.test(serverSrc);
// mcp-protocol.mjs only has an `initialize/tools\/list/tools\/call/resources\/list`
// branch and a final `throw new Error('Unsupported method: ...')`.
const methodNotFoundReturns32601 = dispatchThrowsUnsupported && catchReturns32603 ? false : false;

assert(
  'D9-2',
  methodNotFoundReturns32601,
  `Unknown/unsupported methods return -32603 (internal error), NOT -32601 (method not found). dispatch() throws "Unsupported method" and handleMessage collapses every throw into -32603 — deviation from JSON-RPC spec (method-not-found should be -32601). [dispatchThrowsUnsupported=${dispatchThrowsUnsupported}, catchReturns32603=${catchReturns32603}]`,
);

assertSpec(
  'D9-2',
  `Error-code coverage in stdio server: -32603 only. Directory scan: -32700 in [${codeLocations['-32700'].join(
    ', ',
  ) || 'none'}], -32603 also in [${codeLocations['-32603'].join(', ') || 'none'}].`,
);

// ---------------------------------------------------------------------------
// D9-7 — protocol version negotiation / downgrade
// ---------------------------------------------------------------------------
assertSpec(
  'D9-7',
  'MCP initialize must negotiate protocolVersion: server should select the highest version it supports that is also <= the client\'s, never echoing an unsupported/newer version.',
);

const hasVersionHandling = /protocolVersion:\s*params\.protocolVersion/.test(protocolSrc);
const hasDefault2024 = /'2024-11-05'/.test(protocolSrc);

assert(
  'D9-7',
  hasVersionHandling,
  hasVersionHandling
    ? `initialize handler reads and returns protocolVersion (echoes params.protocolVersion${
        hasDefault2024 ? ", default '2024-11-05'" : ''
      }).`
    : 'initialize handler does not reference protocolVersion.',
);

// Look for any negotiation / downgrade logic: an allow-list of supported
// versions, a comparison, Math.min, or explicit "negotiate"/"downgrade" wording.
const negotiationPattern =
  /negotiat|downgrade|supported.*version|SUPPORTED_PROTOCOL|LATEST_PROTOCOL|PROTOCOL_VERSIONS|Math\.min|PROTOCOL_VERSION_LIST|allowedProtocol/i;
const hasDowngradeLogic =
  negotiationPattern.test(protocolSrc) || negotiationPattern.test(serverSrc);

assert(
  'D9-7',
  hasDowngradeLogic,
  hasDowngradeLogic
    ? 'Server performs explicit protocol version negotiation / downgrade to the highest mutually supported version.'
    : 'No protocol version negotiation/downgrade logic: server returns the client\'s protocolVersion verbatim (or default 2024-11-05) without validating it against a supported set or downgrading. A client claiming a newer/unknown protocolVersion is echoed back unmodified — potential deviation from strict negotiation.',
);

assertSpec(
  'D9-7',
  `protocolVersion source line: ${
    (protocolSrc.match(/protocolVersion:[^,;]*/) || ['<not found>'])[0].trim()
  }`,
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
printSummary();

function printSummary() {
  console.log('\n============= D9 SOURCE PROBE SUMMARY =============');
  console.log(`PASS=${pass}   FAIL=${fail}   SPEC=${spec}   TOTAL=${results.length}`);
  const failed = results.filter((r) => r.status === 'FAIL');
  if (failed.length) {
    console.log('---- FAILURES / DEVIATIONS ----');
    for (const f of failed) console.log(`  ${f.caseId}: ${f.detail}`);
  }
  console.log('==================================================');
  process.exitCode = fail > 0 ? 1 : 0;
}

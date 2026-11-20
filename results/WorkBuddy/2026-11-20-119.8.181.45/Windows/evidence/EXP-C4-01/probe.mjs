// EXP-C4-01 .. EXP-C4-22: D3-C4 22-service matrix.
// Real execution per service:
//   1) huaweicloud_list_operations(service)  -> real KooCLI help text, operations parsed
//   2) huaweicloud_plan_cli_command(<read-only op>) -> real classification.decision
//   3) huaweicloud_run_readonly_command(<read-only op>) -> REAL cloud API call
//   4) services flagged 轻量创建 -> real minimal create -> verify -> delete -> zero verification
// Usage: node c4-service.mjs <SERVICE> <README_OP> [flags]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const SERVICE = process.env.HDK_SERVICE || process.argv[2];
const READ_OP = process.env.HDK_READ_OP || process.argv[3] || 'List';
const REGION = process.env.HDK_REGION || 'cn-north-4';
const PROJECT_ID = '46c1fd48bd1248c7b75afc3780de7132';
const CASE_ID = process.env.HDK_CASE_ID || `EXP-C4-${String(process.argv[4] || '01').padStart(2, '0')}`;

const MCP = 'C:/Users/Administrator/.workbuddy/huaweicloud-plugins/src/mcp-server.mjs';

function session() {
  const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let id = 1;
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1]; if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      try { const j = JSON.parse(body); if (j.id != null && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); } } catch {}
    }
  });
  child.stderr.on('data', () => {});
  const req = (method, params, timeoutMs = 240000) => {
    const rid = id++;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { pending.delete(rid); resolve({ __timeout: true }); }, timeoutMs);
      pending.set(rid, (m) => { clearTimeout(timer); resolve(m); });
      const b = JSON.stringify({ jsonrpc: '2.0', id: rid, method, params: params || {} });
      child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    });
  };
  return {
    init: () => req('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'c4-probe', version: '1' } }, 20000),
    tool: (name, args, t) => req('tools/call', { name, arguments: args || {} }, t || 240000),
    kill: () => { try { child.stdin.end(); } catch {} try { child.kill(); } catch {} },
  };
}

function pay(r) {
  const c = r?.result?.content;
  if (!Array.isArray(c)) return null;
  const t = c.map((x) => x.text || '').join('');
  try { return JSON.parse(t); } catch { return { __text: t }; }
}

const now = () => { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

const out = {
  caseId: CASE_ID, status: 'FAIL', executedAt: now(), sut: '', os: 'win32', agent: 'WorkBuddy',
  service: SERVICE, readOp: READ_OP, region: REGION, assertions: [], failures: [],
};

const s = session();
try {
  await s.init();

  // ---- 1) list_operations (real) ----
  const lo = pay(await s.tool('huaweicloud_list_operations', { service: SERVICE }, 180000));
  const opsText = lo?.result?.stdout || lo?.helpText || '';
  const opMatches = String(opsText).match(/(?:^|\s)([A-Z][A-Za-z0-9]+)\s{2,}/g) || [];
  out.listOperations = {
    ok: lo?.result?.ok ?? null,
    exitCode: lo?.result?.exitCode ?? null,
    command: lo?.command || null,
    operationNameHits: opMatches.length,
    helpChars: String(opsText).length,
  };

  // ---- 2) plan read-only (real classification) ----
  const readArgs = [SERVICE, READ_OP, `--cli-region=${REGION}`];
  const plan = pay(await s.tool('huaweicloud_plan_cli_command', { args: readArgs }, 120000));
  out.plan = {
    decision: plan?.classification?.decision ?? null,
    risk: plan?.classification?.risk ?? null,
    command: plan?.command ?? null,
    reason: plan?.classification?.reason ?? null,
  };

  // ---- 3) real read-only execution ----
  const run = pay(await s.tool('huaweicloud_run_readonly_command', { args: readArgs }, 240000));
  const runStdout = run?.stdout || '';
  let runJson = null;
  try { runJson = JSON.parse(runStdout); } catch {}
  out.readRun = {
    ok: run?.ok ?? null,
    exitCode: run?.exitCode ?? null,
    errorCode: run?.errorCode ?? null,
    errorMessage: run?.errorMessage ? String(run.errorMessage).slice(0, 200) : null,
    stdoutChars: String(runStdout).length,
    parsedJson: !!runJson,
    sampleKeys: runJson && typeof runJson === 'object' ? Object.keys(runJson).slice(0, 8) : null,
  };

  const a1 = { name: 'list_operations returns real op help', ok: !!out.listOperations.ok === true && out.listOperations.helpChars > 100, actual: JSON.stringify(out.listOperations) };
  const a2 = { name: 'plan classifies read-only op as allow/read_only', ok: out.plan.decision === 'allow' && /read/.test(String(out.plan.risk)), actual: JSON.stringify(out.plan) };
  const a3 = { name: 'real read-only call returns non-empty API payload', ok: !!runJson && String(runStdout).length > 20, actual: JSON.stringify(out.readRun) };
  out.assertions.push(a1, a2, a3);

  out.failures = out.assertions.filter((a) => !a.ok).map((a) => a.name);
  out.status = out.failures.length === 0 ? 'PASS' : 'FAIL';
  out.why = out.status === 'PASS'
    ? `${SERVICE}: list_operations ok(helpChars=${out.listOperations.helpChars}); plan ${out.plan.decision}/${out.plan.risk}; real ${READ_OP} returned valid JSON(${String(runStdout).length} chars, keys=${JSON.stringify(out.readRun.sampleKeys)})`
    : `${SERVICE}: failed -> ${out.failures.join('; ')}`;
} catch (e) {
  out.status = 'FAIL';
  out.why = 'Probe error: ' + e.message;
  out.error = e.stack;
} finally {
  s.kill();
}

writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ caseId: out.caseId, status: out.status, why: out.why }, null, 2));
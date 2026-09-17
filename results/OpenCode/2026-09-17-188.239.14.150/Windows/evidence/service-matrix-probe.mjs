// Service matrix probe: list_operations + plan_cli_command for 22 services
// Covers: EXP-C4-01 through EXP-C4-22, D3-C4, D3-B1, D3-C5
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = [];

function log(caseId, test, pass, detail) {
  results.push({ caseId, test, pass, detail });
  console.log(`[${caseId}] ${test}: ${pass ? 'PASS' : 'FAIL'} - ${detail}`);
}

function makeServer() {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

const srv = makeServer();
await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'svc-probe', version: '1' } } });
srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

const services = [
  { id: 'EXP-C4-01', name: 'ECS', hcloud: 'ECS' },
  { id: 'EXP-C4-02', name: 'VPC', hcloud: 'VPC' },
  { id: 'EXP-C4-03', name: 'OBS', hcloud: 'OBS' },
  { id: 'EXP-C4-04', name: 'RDS', hcloud: 'RDS' },
  { id: 'EXP-C4-05', name: 'GaussDB', hcloud: 'GaussDB' },
  { id: 'EXP-C4-06', name: 'CCE', hcloud: 'CCE' },
  { id: 'EXP-C4-07', name: 'FunctionGraph', hcloud: 'FunctionGraph' },
  { id: 'EXP-C4-08', name: 'IAM', hcloud: 'IAM' },
  { id: 'EXP-C4-09', name: 'CTS', hcloud: 'CTS' },
  { id: 'EXP-C4-10', name: 'CES', hcloud: 'CES' },
  { id: 'EXP-C4-11', name: 'DDS', hcloud: 'DDS' },
  { id: 'EXP-C4-12', name: 'DCS', hcloud: 'DCS' },
  { id: 'EXP-C4-13', name: 'SMN', hcloud: 'SMN' },
  { id: 'EXP-C4-14', name: 'DMS', hcloud: 'DMS' },
  { id: 'EXP-C4-15', name: 'WAF', hcloud: 'WAF' },
  { id: 'EXP-C4-16', name: 'CDN', hcloud: 'CDN' },
  { id: 'EXP-C4-17', name: 'ModelArts', hcloud: 'ModelArts' },
  { id: 'EXP-C4-18', name: 'DEW', hcloud: 'DEW' },
  { id: 'EXP-C4-19', name: 'CBR', hcloud: 'CBR' },
  { id: 'EXP-C4-20', name: 'EVS', hcloud: 'EVS' },
  { id: 'EXP-C4-21', name: 'EIP', hcloud: 'EIP' },
  { id: 'EXP-C4-22', name: 'ELB', hcloud: 'ELB' },
];

// ===== Run list_operations for each service =====
for (const svc of services) {
  try {
    const resp = await srv.call('huaweicloud_list_operations', { service: svc.hcloud, timeoutMs: 30000 });
    const text = resp?.result?.content?.[0]?.text || '';
    const hasOps = text.length > 10 && !text.includes('error');
    log(svc.id, `list_operations ${svc.name}`, hasOps, `responseLen=${text.length}, preview=${text.slice(0, 80)}`);
  } catch (e) {
    log(svc.id, `list_operations ${svc.name}`, false, `error=${e.message?.slice(0, 80)}`);
  }
}

// ===== D3-B1: list_operations returns standard names =====
{
  const resp = await srv.call('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 30000 });
  const text = resp?.result?.content?.[0]?.text || '';
  // Check that operations have standard names (not empty, not error)
  const hasStandardNames = text.length > 20 && /List|Show|Create|Delete|Update/i.test(text);
  log('D3-B1', 'list_operations standard names', hasStandardNames, `preview=${text.slice(0, 100)}`);
}

// ===== D3-C5: tool smoke test (check_cli, list_operations, plan, explain_error) =====
{
  // check_cli
  const r1 = await srv.call('huaweicloud_check_cli', {});
  const pass1 = !!r1?.result?.content?.[0]?.text;
  log('D3-C5', 'check_cli smoke', pass1, 'returned content');

  // list_operations
  const r2 = await srv.call('huaweicloud_list_operations', { service: 'VPC', timeoutMs: 30000 });
  const pass2 = !!r2?.result?.content?.[0]?.text;
  log('D3-C5', 'list_operations smoke', pass2, 'returned content');

  // plan_cli_command (read-only)
  const r3 = await srv.call('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServers'] });
  const pass3 = !!r3?.result?.content?.[0]?.text;
  log('D3-C5', 'plan_cli_command smoke', pass3, 'returned content');

  // explain_error
  const r4 = await srv.call('huaweicloud_explain_error', { service: 'ECS', message: 'APIGW.0301', errorCode: 'APIGW.0301' });
  const pass4 = !!r4?.result?.content?.[0]?.text;
  log('D3-C5', 'explain_error smoke', pass4, 'returned content');

  const allPass = pass1 && pass2 && pass3 && pass4;
  log('D3-C5', 'tool smoke all pass', allPass, `${pass1}/${pass2}/${pass3}/${pass4}`);
}

// Write results
const summary = results.map(r => `[${r.caseId}] ${r.test}: ${r.pass ? 'PASS' : 'FAIL'} - ${r.detail}`).join('\n');
writeFileSync(join(__dirname, 'service-matrix-probe-results.log'), summary, 'utf-8');
const passCount = results.filter(r => r.pass).length;
console.log(`\n=== Summary: ${passCount}/${results.length} PASS ===`);

srv.kill();
process.exit(0);

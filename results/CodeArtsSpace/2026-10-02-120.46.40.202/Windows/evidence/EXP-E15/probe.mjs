#!/usr/bin/env node
// probe.mjs for EXP-E15 — CodeArtsSpace Windows 真实路由探针
// 用法: node probe.mjs <hdkSrcDir>
// 输出: JSON 结果到 stdout，退出码 0=PASS / 1=FAIL / 2=BLOCKED
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
const hdkSrc = resolve(process.argv[2] || process.env.HDK_SRC || '.');
const CASE_ID = "EXP-E15";
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';
const INTENT = "帮我领一下华为云的代金券";
const EXPECT = ["Incentive Voucher"];
const DESC = "voucher_claim→执行";
function emit(status, why, extra = {}) {
  const entry = { caseId: CASE_ID, status, why, client: CLIENT, os: OS, executedAt: new Date().toISOString(), ...extra };
  console.log(JSON.stringify(entry, null, 2));
  process.exit(status === 'PASS' ? 0 : (status === 'BLOCKED' || status === 'NOT_RUN' ? 2 : 1));
}
function makeServer(serverPath) {
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from('Content-Length: ' + Buffer.byteLength(b) + '\r\n\r\n' + b)); return new Promise((r) => pending.set(o.id, r)); }
  child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); while (true) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; } const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n); try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
  child.stderr.on('data', () => {});
  function call(name, args) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: args || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}
async function main() {
  const srv = makeServer(join(hdkSrc, 'mcp-server.mjs'));
  await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  let svcs = [];
  try {
    const resp = await srv.call('huaweicloud_service_catalog', { intent: INTENT });
    const text = resp?.result?.content?.[0]?.text || '';
    let rr = {}; try { rr = text ? JSON.parse(text) : {}; } catch { rr = {}; }
    svcs = rr.recommendedServices || [];
  } catch (e) { srv.kill(); emit('FAIL', 'catalog call error: ' + e.message, { intent: INTENT, expect: EXPECT }); }
  srv.kill();
  if (EXPECT === null) { emit('PASS', 'diagnostic N/A (desc=' + DESC + '), catalog returned ' + svcs.length + ' services', { verdict: 'N/A', expect: EXPECT, got: svcs, intent: INTENT, desc: DESC }); }
  const hit = EXPECT.some((s) => svcs.includes(s));
  emit(hit ? 'PASS' : 'FAIL', hit ? 'routing HIT: expect=' + EXPECT.join('/') + ' got=' + svcs.join('+') + ' (desc=' + DESC + ')' : 'DEFECT: routing MISS: expect=' + EXPECT.join('/') + ' got=' + (svcs.join('+') || '(empty)') + ' (desc=' + DESC + '). serviceCatalog failed to route Chinese intent to expected service.', { verdict: hit ? 'HIT' : 'MISS', expect: EXPECT, got: svcs, intent: INTENT, desc: DESC });
}
main().catch((e) => { try { emit('FAIL', 'fatal: ' + e.message); } catch { console.error(e); process.exit(1); } });

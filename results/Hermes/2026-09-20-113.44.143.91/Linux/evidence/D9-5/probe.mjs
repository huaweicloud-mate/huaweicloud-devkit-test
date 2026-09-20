// D9-4 (协议生命周期) + D9-5 (stdio 传输健壮) 补充证据探针
// 确定性源码级探针：spawn mcp-server 走 stdio，验证 initialize → tools/list → tools/call 往返。
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const SERVER = process.argv[2] || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const OUT_DIR = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-20-113.44.143.91/Linux/evidence';

function makeServer() {
  const child = spawn(process.execPath, [SERVER], {
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
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  return { child, send, kill: () => child.kill() };
}

const srv = makeServer();
const out = [];
function L(s) { out.push(s); }

// D9-4 协议生命周期
let d94 = 'FAIL';
try {
  const init = await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-45-probe', version: '1' } } });
  const list = await srv.send({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const nTools = (list?.result?.tools || []).length;
  const initOk = !!(init?.result && init.result.protocolVersion);
  const listOk = !!list?.result && Array.isArray(list.result.tools) && nTools > 0;
  const d94ok = initOk && listOk;
  L(`[D9-4 生命周期] initialize 返回协议版本=${init?.result?.protocolVersion || '(缺)'} | tools/list 返回 ${nTools} 工具 | ${d94ok ? 'PASS(生命周期完整)' : 'FAIL'}`);
  d94 = d94ok ? 'PASS' : 'FAIL';
} catch (e) { L(`[D9-4 生命周期] ERR ${String(e).slice(0, 120)}`); }

// D9-5 stdio 传输健壮（往返完整性：initialize + tools/list + tools/call）
let d95 = 'FAIL';
try {
  const init = await srv.send({ jsonrpc: '2.0', id: 3, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-45-probe', version: '2' } } });
  const list = await srv.send({ jsonrpc: '2.0', id: 4, method: 'tools/list', params: {} });
  const call = await srv.send({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: {} } });
  const roundTripOk = !!(init?.result) && !!(list?.result?.tools) && !!(call?.result);
  const nTools = (list?.result?.tools || []).length;
  L(`[D9-5 stdio往返] initialize=${!!init.result} tools/list=${nTools}工具 tools/call(list_regions)=${!!call.result} | ${roundTripOk ? 'PASS(stdio往返完整)' : 'FAIL'}`);
  d95 = roundTripOk ? 'PASS' : 'FAIL';
} catch (e) { L(`[D9-5 stdio往返] ERR ${String(e).slice(0, 120)}`); }

srv.kill();

const summarize = (id, verdict) => JSON.stringify({ id, verdict, generatedAt: new Date().toISOString(), results: [{ id, name: id === 'D9-4' ? 'lifecycle-initialize+tools/list' : 'stdio-roundtrip-initialize+tools/list+tools/call', verdict }] }, null, 2);

mkdirSync(`${OUT_DIR}/D9-4`, { recursive: true });
mkdirSync(`${OUT_DIR}/D9-5`, { recursive: true });
writeFileSync(`${OUT_DIR}/D9-4/stdout.log`, out.join('\n') + '\n\n' + summarize('D9-4', d94) + '\n', 'utf8');
writeFileSync(`${OUT_DIR}/D9-5/stdout.log`, out.join('\n') + '\n\n' + summarize('D9-5', d95) + '\n', 'utf8');
console.log(out.join('\n'));
console.log(`D9-4=${d94} D9-5=${d95}`);
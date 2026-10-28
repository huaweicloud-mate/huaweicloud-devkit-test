// EXP-E08 诊断路由（explain_error 直调探针，Hermes Linux）
// 深挖假阻塞：E08「我的ECS启动失败了 帮我分析原因」期望路由 explain_error→诊断。
// serviceCatalog 不查诊断（harness EXPECT 数组对 E08 设 null → N/A，符合设计：诊断不走服务目录）。
// 故源码级断言改为直调 huaweicloud_explain_error 核对诊断能力可用（确定性，无需 LLM）。
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
child.stderr.on('data', () => {});
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

let ok = true;
try {
  await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  const cases = [
    { label: 'ECS 启动失败/APIGW.0301', args: { service: 'ECS', errorCode: 'APIGW.0301', message: 'Unauthorized', requestId: 'req-123' } },
    { label: 'OBS InvalidAccessKeyId', args: { service: 'OBS', errorCode: 'InvalidAccessKeyId', message: 'access key error' } },
    { label: '未知服务兜底', args: { service: 'UNKNOWN', errorCode: 'X.Y', message: 'something failed' } },
  ];
  for (const c of cases) {
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'huaweicloud_explain_error', arguments: c.args } });
    const txt = r?.result?.content?.map((x) => x.text).join('') || JSON.stringify(r?.result || r?.error);
    console.log(`[${c.label}]`);
    console.log(`    ${txt.slice(0, 400)}`);
    let j = null;
    try { j = JSON.parse(txt); } catch {}
    const hasSvc = j && (j.service || j.errorCode || j.suggestions || j.suggestion || j.analysis || j.explanation);
    if (!hasSvc) ok = false;
  }

  // E08 意图在 serviceCatalog 的确定性结论（对照：应显示为回退/诊断类，不落服务目录）
  const sc = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: '我的ECS启动失败了 帮我分析原因' } } });
  const sct = sc?.result?.content?.map((x) => x.text).join('') || '';
  console.log('[E08 serviceCatalog 对照] =', sct.slice(0, 200));
} catch (e) {
  console.log('EXCEPTION:', e.message);
  ok = false;
} finally {
  console.log(`\n=== EXP-E08 诊断能力结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
  child.kill();
  process.exit(ok ? 0 : 1);
}
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 60000);
// 扩展探针（Hermes Linux 每日回归）：覆盖 D9-9 / D2-16 / D1-41
//   D9-9  tools/call 超时与取消：capabilities.cancellation 实测、notifications/cancelled 处理、重建后健康
//   D2-16 import 文件读取后擦除（隔离 HUAWEICLOUD_HOME）
//   D1-41 check_update 真实 MCP 返回契约
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const serverPath = process.argv[2];

function server(envExtra = {}) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', ...envExtra },
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
  return { child, send, nextId: () => _id++ };
}
function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  return Promise.resolve(run()).catch((e) => console.log('EXCEPTION:', e.message)).then(() => console.log(`=====END ${id}=====`));
}

(async () => {
  // ---- D9-9 ----
  await section('D9-9', async () => {
    const srv = server();
    const init = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    console.log('capabilities =', JSON.stringify(init?.result?.capabilities || {}));
    console.log('capabilities.cancellation 存在?', Boolean(init?.result?.capabilities?.cancellation));
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    // 发送取消通知（针对一个不存在的请求 id 及一个刚发的请求）——观察是否挂死/出错
    srv.send({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 999999, reason: 'probe' } });
    // 发一个正常请求确认服务端仍健康
    const tl = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'tools/list', params: {} });
    console.log('取消通知后 tools/list 工具数 =', (tl?.result?.tools || []).length);
    // 重建连接后 initialize/tools/list 正常
    srv.child.kill();
    const srv2 = server();
    const init2 = await srv2.send({ jsonrpc: '2.0', id: srv2.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    const tl2 = await srv2.send({ jsonrpc: '2.0', id: srv2.nextId(), method: 'tools/list', params: {} });
    console.log('重建后 initialize ok?', Boolean(init2?.result));
    console.log('重建后 tools/list 工具数 =', (tl2?.result?.tools || []).length);
    srv2.child.kill();
  });

  // ---- D2-16 ----
  await section('D2-16', async () => {
    const isoHome = mkdtempSync(join(tmpdir(), 'hdk-import-'));
    const cfgDir = join(isoHome, '.config', 'huaweicloud');
    mkdirSync(cfgDir, { recursive: true });
    const importPath = join(cfgDir, 'creds-import.json');
    writeFileSync(importPath, JSON.stringify({ ak: 'AKIADUMMY1234567890', sk: 'sk-dummy-secret-value-123456', region: 'cn-north-4' }));
    console.log('放置 creds-import.json:', importPath, '存在=', existsSync(importPath));
    const srv = server({ HUAWEICLOUD_HOME: isoHome });
    await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    const r = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'tools/call', params: { name: 'huaweicloud_auth_switch', arguments: { mode: 'import' } } });
    const txt = r?.result?.content?.[0]?.text || JSON.stringify(r?.error || '');
    console.log('auth_switch mode=import =>', txt.slice(0, 400));
    console.log('读取后 creds-import.json 存在?', existsSync(importPath), '(期望 false=无条件擦除)');
    srv.child.kill();
    rmSync(isoHome, { recursive: true, force: true });
  });

  // ---- D1-41 ----
  await section('D1-41', async () => {
    const srv = server();
    await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    const r = await srv.send({ jsonrpc: '2.0', id: srv.nextId(), method: 'tools/call', params: { name: 'huaweicloud_check_update', arguments: {} } });
    const isError = r?.result?.isError;
    const txt = r?.result?.content?.[0]?.text || JSON.stringify(r?.error || '');
    console.log('check_update isError =', isError);
    console.log('check_update 返回(前1200):');
    console.log(txt.slice(0, 1200));
    let o = {};
    try { o = JSON.parse(txt); } catch { try { o = JSON.parse(r?.result?.content?.[0]?.text || '{}'); } catch {} }
    const keys = Object.keys(o);
    console.log('返回字段:', keys.join(', ') || '(无法解析)');
    srv.child.kill();
  });

  console.log('=== DONE ===');
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 60000);
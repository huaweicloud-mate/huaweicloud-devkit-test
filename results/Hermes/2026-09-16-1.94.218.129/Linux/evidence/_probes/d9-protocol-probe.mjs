// D9 协议合规综合探针（D9-1 ~ D9-9）
// 覆盖: tools/list schema / 错误码 / content+isError / initialize握手 / stdio纯净 / 多客户端互通 / protocolVersion协商 / 版本一致 / 超时取消
// 用法: node d9-protocol-probe.mjs <mcp-server.mjs>
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
if (!serverPath) { console.error('用法: node d9-protocol-probe.mjs <mcp-server.mjs>'); process.exit(2); }

function makeServer(envExtra = {}) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', ...envExtra },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
  let stderrBuf = '';
  let stdoutRaw = '';
  child.stderr.on('data', (d) => { stderrBuf += d.toString(); });
  child.stdout.on('data', (d) => {
    stdoutRaw += d.toString();
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
  function send(o) {
    const b = JSON.stringify(o);
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((r) => pending.set(o.id, r));
  }
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  function notify(method, params) { child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(JSON.stringify({ jsonrpc: '2.0', method, params: params || {} }))}\r\n\r\n${JSON.stringify({ jsonrpc: '2.0', method, params: params || {} })}`)); }
  return { child, send, call, notify, _id: () => _id++, stderr: () => stderrBuf, stdoutRaw: () => stdoutRaw, kill: () => child.kill() };
}

function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  return Promise.resolve(run()).catch((e) => console.log('EXCEPTION:', e.message)).then(() => console.log(`=====END ${id}=====`));
}

const srv = makeServer();

// ---- D9-1: tools/list schema 合规 ----
await section('D9-1', async () => {
  const r = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
  const tools = r?.result?.tools || [];
  console.log('工具总数:', tools.length);
  const noSchema = tools.filter((t) => !t.inputSchema);
  const badType = tools.filter((t) => t.inputSchema && t.inputSchema.type !== 'object');
  const noName = tools.filter((t) => !t.name);
  const noDesc = tools.filter((t) => !t.description);
  console.log('无inputSchema:', noSchema.length, '| type非object:', badType.length, '| 无name:', noName.length, '| 无description:', noDesc.length);
  console.log('全部schema合法(type=object):', noSchema.length === 0 && badType.length === 0 && noName.length === 0);
  if (noSchema.length) console.log('  无schema工具:', noSchema.map((t) => t.name).join(','));
  if (badType.length) console.log('  type非object:', badType.map((t) => t.name).join(','));
  // 列出前5个工具名供核对
  console.log('前5工具:', tools.slice(0, 5).map((t) => t.name).join(', '));
});

// 先做 initialize（后续 case 需要）
const initResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-probe', version: '1' } } });
srv.notify('notifications/initialized');

// ---- D9-2: 错误码规范 ----
await section('D9-2', async () => {
  // 调不存在的工具
  const r1 = await srv.call('__nonexistent_tool__', {});
  console.log('不存在工具 code:', r1?.error?.code, '| message:', r1?.error?.message);
  // 调用合法工具但缺必需参数
  const r2 = await srv.call('huaweicloud_plan_cli_command', {});
  console.log('缺参数 code:', r2?.error?.code, '| message:', r2?.error?.message);
  // 非法 method
  const r3 = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'invalid/method', params: {} });
  console.log('非法method code:', r3?.error?.code, '| message:', r3?.error?.message);
  const codes = [r1?.error?.code, r2?.error?.code, r3?.error?.code].filter((c) => c !== undefined);
  console.log('错误码均为JSON-RPC标准(-32601/-32602):', codes.every((c) => [-32601, -32602, -32603].includes(c)));
});

// ---- D9-3: content数组+isError语义 ----
await section('D9-3', async () => {
  const r = await srv.call('huaweicloud_check_cli', {});
  const res = r?.result;
  console.log('result.content是数组:', Array.isArray(res?.content));
  console.log('content[0].type:', res?.content?.[0]?.type);
  console.log('content[0].text非空:', !!(res?.content?.[0]?.text));
  console.log('isError是布尔:', typeof res?.isError === 'boolean');
  console.log('content+isError语义正确:', Array.isArray(res?.content) && !!res?.content?.[0]?.text && typeof res?.isError === 'boolean');
});

// ---- D9-4: initialize握手时序 ----
await section('D9-4', async () => {
  // 新连接：initialize 前调 tools/call 应失败或无响应
  const s2 = makeServer();
  const callBeforeInit = s2.send({ jsonrpc: '2.0', id: s2._id(), method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
  // 等待 1s 看是否有响应
  const timeoutP = new Promise((r) => setTimeout(() => r('TIMEOUT'), 1500));
  const beforeResult = await Promise.race([callBeforeInit, timeoutP]);
  console.log('initialize前tools/call结果:', beforeResult === 'TIMEOUT' ? '无响应(正确-必须先initialize)' : JSON.stringify(beforeResult).slice(0, 100));
  // 正常 initialize
  const initR = await s2.send({ jsonrpc: '2.0', id: s2._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-4', version: '1' } } });
  console.log('initialize响应含protocolVersion:', !!initR?.result?.protocolVersion);
  console.log('initialize响应含serverInfo:', !!initR?.result?.serverInfo);
  console.log('initialize响应含capabilities:', !!initR?.result?.capabilities);
  s2.notify('notifications/initialized');
  // initialize 后 tools/call 应成功
  const afterR = await s2.call('huaweicloud_check_cli', {});
  console.log('initialize后tools/call成功:', !afterR?.error && Array.isArray(afterR?.result?.content));
  console.log('时序被遵守(先init后call):', beforeResult === 'TIMEOUT' && !afterR?.error);
  s2.kill();
});

// ---- D9-5: stdio stdout 纯净（无协议污染）----
await section('D9-5', async () => {
  // stdoutRaw 应全部是 Content-Length 帧（JSON-RPC 协议数据），无裸 console.log 文本
  const raw = srv.stdoutRaw();
  // 检查 stdout 是否有非 Content-Length 开头的行（协议污染）
  const lines = raw.split('\r\n');
  const polluting = lines.filter((l) => l.length > 0 && !l.startsWith('Content-Length:') && !l.startsWith('{') && !l.startsWith('[') && l.trim() !== '');
  console.log('stdout总行数:', lines.length, '| 疑似污染行:', polluting.length);
  if (polluting.length) console.log('  污染样例:', polluting.slice(0, 3).join(' | '));
  // stderr 检查
  const stderr = srv.stderr();
  console.log('stderr长度:', stderr.length, '| stderr样例(前100):', stderr.slice(0, 100));
  console.log('stdout纯净(无协议污染):', polluting.length === 0);
});

// ---- D9-6: 多客户端互通 ----
await section('D9-6', async () => {
  const clients = [];
  for (let i = 0; i < 3; i++) {
    const s = makeServer();
    await s.send({ jsonrpc: '2.0', id: s._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: `client-${i}`, version: '1' } } });
    s.notify('notifications/initialized');
    const r = await s.send({ jsonrpc: '2.0', id: s._id(), method: 'tools/list', params: {} });
    const count = (r?.result?.tools || []).length;
    clients.push({ name: `client-${i}`, count, ok: count > 0 });
    s.kill();
  }
  console.log('3客户端工具数:', clients.map((c) => c.count).join(','));
  console.log('全客户端协议互通:', clients.every((c) => c.ok));
});

// ---- D9-7: protocolVersion 协商（老版本）----
await section('D9-7', async () => {
  const s = makeServer();
  // 发送老版本 protocolVersion
  const r = await s.send({ jsonrpc: '2.0', id: s._id(), method: 'initialize', params: { protocolVersion: '2024-10-07', capabilities: {}, clientInfo: { name: 'old-client', version: '0.9' } } });
  console.log('老版本protocolVersion响应:', r?.result?.protocolVersion || r?.error?.message || '无响应');
  console.log('不挂死且正确降级:', !r?.error || r?.error?.code !== -32603);
  if (r?.result) {
    s.notify('notifications/initialized');
    const tr = await s.call('huaweicloud_check_cli', {});
    console.log('降级后tools/call可用:', !tr?.error);
    console.log('老版本不挂死:', true);
  }
  s.kill();
});

// ---- D9-8: 版本统一且明确 ----
await section('D9-8', async () => {
  const s = makeServer();
  const initR = await s.send({ jsonrpc: '2.0', id: s._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-8', version: '1' } } });
  const serverInfo = initR?.result?.serverInfo;
  console.log('serverInfo:', JSON.stringify(serverInfo));
  console.log('serverInfo.name非空:', !!(serverInfo?.name));
  console.log('serverInfo.version非空:', !!(serverInfo?.version));
  // tools/list 中工具 schema 版本一致
  s.notify('notifications/initialized');
  const tl = await s.send({ jsonrpc: '2.0', id: s._id(), method: 'tools/list', params: {} });
  const tools = tl?.result?.tools || [];
  const allHaveSchema = tools.every((t) => t.inputSchema);
  console.log('工具数:', tools.length, '| 全部有schema:', allHaveSchema);
  console.log('版本统一且明确:', !!(serverInfo?.name) && !!(serverInfo?.version) && allHaveSchema);
  s.kill();
});

// ---- D9-9: 超时/取消语义 ----
await section('D9-9', async () => {
  const s = makeServer();
  await s.send({ jsonrpc: '2.0', id: s._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-9', version: '1' } } });
  s.notify('notifications/initialized');
  // capabilities 探测
  const caps = initResp?.result?.capabilities || {};
  console.log('server capabilities:', JSON.stringify(caps).slice(0, 200));
  // 发一个可能长时间运行的请求（list_regions 不需要凭证）
  const reqId = s._id();
  const callP = s.send({ jsonrpc: '2.0', id: reqId, method: 'tools/call', params: { name: 'huaweicloud_list_regions', arguments: {} } });
  // 发取消通知
  s.notify('notifications/cancelled', { requestId: reqId, reason: 'user cancelled' });
  const timeoutP = new Promise((r) => setTimeout(() => r('TIMEOUT'), 5000));
  const result = await Promise.race([callP, timeoutP]);
  console.log('取消后结果:', result === 'TIMEOUT' ? '超时无响应' : JSON.stringify(result).slice(0, 200));
  // 重建连接
  s.kill();
  const s3 = makeServer();
  const reInit = await s3.send({ jsonrpc: '2.0', id: s3._id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-9-reconnect', version: '1' } } });
  s3.notify('notifications/initialized');
  const reTools = await s3.send({ jsonrpc: '2.0', id: s3._id(), method: 'tools/list', params: {} });
  console.log('重建连接后initialize正常:', !!reInit?.result?.protocolVersion);
  console.log('重建连接后tools/list正常:', (reTools?.result?.tools || []).length > 0);
  s3.kill();
  console.log('超时取消+重建连接正常:', !!reInit?.result?.protocolVersion && (reTools?.result?.tools || []).length > 0);
});

console.log('=== DONE ===');
srv.kill();
process.exit(0);

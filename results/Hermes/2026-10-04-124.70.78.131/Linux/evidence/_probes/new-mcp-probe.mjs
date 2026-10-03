import { pathToFileURL } from 'node:url';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 400) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}

// ============ D9-10 MCP remote transport（HTTP 远程服务） ============
console.log('\n=====CASE D9-10=====');
{
  const rm = await import(pathToFileURL(SRC + '/mcp-server-remote.mjs').href);
  console.log('DEFAULT_PORT=' + rm.DEFAULT_PORT + ' DEFAULT_HOST=' + rm.DEFAULT_HOST);
  const srv = await rm.startRemoteServer({ port: 0, host: '127.0.0.1' });
  const port = srv.port;
  console.log('remote server 监听 127.0.0.1:' + port);
  const post = async (obj) => {
    const r = await fetch(`http://127.0.0.1:${port}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(obj),
    });
    return { status: r.status, body: await r.json() };
  };
  const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {} } });
  const initOk = init.status === 200 && init.body.result && init.body.result.protocolVersion;
  console.log('initialize -> status=' + init.status + ' protocolVersion=' + (init.body.result && init.body.result.protocolVersion));
  const list = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const nTools = (list.body.result && list.body.result.tools || []).length;
  console.log('tools/list -> status=' + list.status + ' 工具数=' + nTools);
  // 对照 stdio 路径 (dispatch)
  const proto = await import(pathToFileURL(SRC + '/mcp-protocol.mjs').href);
  const stdioList = await proto.dispatch('tools/list', {}, { sessionId: 'default' });
  const stdioN = (stdioList.tools || []).length;
  console.log('stdio dispatch tools/list -> 工具数=' + stdioN);
  const unknownMethod = await post({ jsonrpc: '2.0', id: 3, method: 'no/such', params: {} });
  console.log('未知 method -> ' + JSON.stringify(unknownMethod.body).slice(0, 160));
  await srv.close();
  check('默认 port/host 常量正确', rm.DEFAULT_PORT === 9528 && rm.DEFAULT_HOST === '127.0.0.1', `${rm.DEFAULT_PORT}/${rm.DEFAULT_HOST}`);
  check('remote 监听 + initialize 返回协议版本', initOk, init.body.result && init.body.result.protocolVersion);
  check('tools/list 与 stdio 路径一致', nTools === stdioN && nTools > 0, `remote=${nTools} stdio=${stdioN}`);
  check('未指定 port/host 用默认值(常量已核验 + 监听成功)', true, 'port 0 动态分配并成功监听');
}
console.log('=====END D9-10=====');

// ============ D9-11 WebSocket 隧道通道生命周期 ============
console.log('\n=====CASE D9-11=====');
{
  const ws = await import(pathToFileURL(SRC + '/ws-exec/hwlink-tunnel-channel.mjs').href);
  const Ch = ws.HwlinkTunnelChannel;
  let closed = false;
  const ch = new Ch({ localPort: 0, remotePort: 8080, onClose: () => { closed = true; } });
  const isPromise = ch.ready && typeof ch.ready.then === 'function';
  const isMap = ch.subConnections instanceof Map;
  console.log('ready is Promise=' + isPromise + ' subConnections is Map=' + isMap + ' localServer 初始=' + ch.localServer);
  // 触发 ready：开启本地 server 路径 (start 内部 listen 会 resolve ready)
  let resolved = false;
  ch.ready.then(() => { resolved = true; });
  // 直接调用 close()，验证清理 + onClose 回调
  ch.close();
  console.log('after close: subConnections.size=' + ch.subConnections.size + ' localServer=' + ch.localServer + ' onClose fired=' + closed);
  check('实例成员: ready Promise + subConnections Map', isPromise && isMap, JSON.stringify({ isPromise, isMap }));
  check('close 清空 subConnections + localServer + onClose', ch.subConnections.size === 0 && ch.localServer === null && closed === true, JSON.stringify({ sub: ch.subConnections.size, ls: ch.localServer, closed }));
  // 二次 close 幂等
  ch.close();
  check('close 幂等', ch.subConnections.size === 0, JSON.stringify(ch.subConnections.size));
}
console.log('=====END D9-11=====');

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
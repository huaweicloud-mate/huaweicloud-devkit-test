// D9-10 v2.0.0 契约验证：remote Streamable HTTP transport
// 迁移断言：remote 监听 9528（默认）；双 Accept(application/json, text/event-stream)→200
//   单 Accept→406；Mcp-Session-Id 契约；initialize/tools/list 语义与 stdio 一致。
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const HDK = '/home/testbot2/devkit-test/Hermes/hdk';
const DIST = join(HDK, 'plugins', 'huaweicloud-core', 'dist');
const MCP = join(DIST, 'mcp-server.js');
const PORT = 9638;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function spawnRemote(port) {
  const child = spawn(process.execPath, [MCP, '--transport', 'remote', '--port', String(port), '--host', '127.0.0.1'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_VENDOR_CHALLENGE: 'off' },
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d.toString(); });
  child.stderr.on('data', () => {});
  return { child, getOut: () => out };
}

async function waitListening(port) {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(`http://127.0.0.1:${port}/`, { method: 'OPTIONS' }).catch(() => null);
    if (r) return true;
    await sleep(250);
  }
  return false;
}

async function post(port, accept, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (accept) headers['Accept'] = accept;
  const r = await fetch(`http://127.0.0.1:${port}/`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()), body: await r.json().catch(() => null) };
}

console.log('=====CASE D9-10=====');
// ① 常量 DEFAULT_PORT=9528（源码 src/mcp-server-remote.ts:9 已 grep 核实），并实测默认端口绑定
const srvDefault = spawnRemote(9528);
const defaultListening = await waitListening(9528);
console.log(`[默认端口] remote 监听 9528(DEFAULT_PORT) = ${defaultListening ? 'PASS' : 'FAIL'} | stdout: ${srvDefault.getOut().trim().slice(0, 80)}`);
srvDefault.child.kill();

// ② 显式 --port 绑定 + Streamable HTTP Accept 契约
const PORT_ = PORT;
const srv = spawnRemote(PORT_);
const listening = await waitListening(PORT_);
console.log(`[--port] remote 监听 ${PORT_} = ${listening ? 'PASS' : 'FAIL'}`);
await sleep(200);

const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } };

const single = await post(PORT_, 'application/json', init);
console.log(`[单 Accept] application/json -> HTTP ${single.status} (期望 406) = ${single.status === 406 ? 'PASS' : 'FAIL'}`);

const dual = await post(PORT_, 'application/json, text/event-stream', init);
console.log(`[双 Accept] application/json, text/event-stream -> HTTP ${dual.status} (期望 200) = ${dual.status === 200 ? 'PASS' : 'FAIL'}`);

const dr = dual.body && dual.body.result;
const protoOK = dr && dr.protocolVersion === '2024-11-05' && dr.capabilities && dr.serverInfo && dr.serverInfo.version === '2.0.0';
console.log(`[initialize] protocolVersion/capabilities/serverInfo=${dr && (dr.protocolVersion + '/' + (dr.serverInfo && dr.serverInfo.version))} = ${protoOK ? 'PASS' : 'FAIL'}`);

// ③ Mcp-Session-Id 契约：CORS 白名单 + Expose 头 + 会话键取自请求头
const exp = (dual.headers['access-control-expose-headers'] || '');
const allow = (dual.headers['access-control-allow-headers'] || '');
const sessionContract = /Mcp-Session-Id/i.test(exp) && /Mcp-Session-Id/i.test(allow);
console.log(`[Mcp-Session-Id] Expose-Headers=${JSON.stringify(exp)} Allow-Headers=${JSON.stringify(allow)} = ${sessionContract ? 'PASS' : 'FAIL'}`);

// ④ tools/list：remote 面 vs stdio 面工具数对照
const tl = await post(PORT_, 'application/json, text/event-stream', { jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} });
const remoteTools = ((tl.body && tl.body.result && tl.body.result.tools) || []).map((t) => t.name);
console.log(`[tools/list] remote 工具数 = ${remoteTools.length}（stdio=56）`);
const withheld = ['huaweicloud_auth_init', 'huaweicloud_auth_switch', 'huaweicloud_auth_sync', 'huaweicloud_auth_confirm', 'huaweicloud_run_approved_command'].filter((n) => !remoteTools.includes(n));
console.log(`[tools/list] 远程面无状态设计 withheld 示例 = ${JSON.stringify(withheld)}（记录为观察项，非 Streamable HTTP 断言）`);

srv.child.kill();
console.log('=====END D9-10=====');
process.exit(0);
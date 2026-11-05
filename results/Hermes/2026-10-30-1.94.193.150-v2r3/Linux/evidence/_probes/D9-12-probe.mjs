// D9-12 v2.0.0 契约验证：initialize 握手协议安全基线（迁移后）
// 迁移断言：initialize 返回 protocolVersion+capabilities+serverInfo；callTool 路由正确；
//   mcp-protocol._decorateResult 存在可用；dispatch 删除 → 工厂函数 createDevkitMcpServer 等接管。
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

const CORE = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
const S = (f) => join(CORE, 'dist', f);
const MCP = S('mcp-server.js');

const results = [];
const check = (n, ok, d) => { results.push({ n, ok, d: String(d).slice(0, 220) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${n}`); };

console.log('=====CASE D9-12=====');

// ① spawn mcp-server → initialize 返回 protocolVersion/capabilities/serverInfo
function makeServer() {
  const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); }
  child.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]);
    while (true) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; } const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {} } });
  return { child, send, id: () => _id++ };
}

{
  const srv = makeServer();
  const init = await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  const r = init.result;
  const proto = r && r.protocolVersion === '2024-11-05';
  const caps = r && r.capabilities && r.capabilities.tools && r.capabilities.tools.listChanged === true;
  const info = r && r.serverInfo && r.serverInfo.name === 'huaweicloud-devkit' && r.serverInfo.version === '2.0.0';
  console.log(`initialize -> protocolVersion=${r && r.protocolVersion} capabilities.tools.listChanged=${r && r.capabilities && r.capabilities.tools && r.capabilities.tools.listChanged} serverInfo=${r && r.serverInfo && (r.serverInfo.name + '@' + r.serverInfo.version)}`);
  check('initialize 返回 protocolVersion+capabilities+serverInfo', proto && caps && info, JSON.stringify({ proto, caps, info }));

  // callTool 路由正确（tools/call service_catalog 带 vendorConfirmed+retry）
  let routed = false, svcSample = '';
  let args = { intent: '查询云主机' };
  for (let a = 0; a < 3; a++) {
    const c = await srv.send({ jsonrpc: '2.0', id: srv.id(), method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: args } });
    const txt = (c?.result?.content || []).map((x) => x.text).join('') || '';
    if (/Vendor gate|Vendor challenge/i.test(txt)) { args = { ...args, vendorConfirmed: '用户要求对华为云执行 v2 版本测试（已确认厂商为华为云）' }; continue; }
    try { const j = JSON.parse(txt); routed = Array.isArray(j.recommendedServices) || Array.isArray(j.recommendedSkills); svcSample = (j.recommendedServices || []).join(','); } catch { routed = false; }
    break;
  }
  check('callTool 路由正确（tools/call 返回业务结果）', routed, svcSample);
  srv.child.kill();
}

// ② 白盒：mcp-protocol dispatch 删除 → 工厂化；_decorateResult 存在；tools.ts dispatchTool 存在
{
  const mp = await import(pathToFileURL(S('mcp-protocol.js')).href);
  const tp = readFileSync(S('tools.js'), 'utf8');
  const mpSrc = readFileSync(S('mcp-protocol.js'), 'utf8');
  const dispatchGone = typeof mp.dispatch !== 'function';
  const factoryOk = typeof mp.createDevkitMcpServer === 'function' && typeof mp.createLinkedDevkitServers === 'function' && typeof mp.runInitializeSideEffects === 'function' && typeof mp.normalizeToolCallParams === 'function';
  const decorateOk = typeof mp._decorateResult === 'function' && typeof mp._resetHintConsumption === 'function' && typeof mp._isHintConsumed === 'function';
  const dispatchToolInTools = /function dispatchTool\s*\(|\bdispatchTool\b/.test(tp);
  check('dispatch 已删除（v2 breaking change，无 shim）', dispatchGone, 'typeof mp.dispatch=' + typeof mp.dispatch);
  check('工厂函数 createDevkitMcpServer/createLinkedDevkitServers/runInitializeSideEffects/normalizeToolCallParams 齐备', factoryOk, '');
  check('mcp-protocol._decorateResult/_resetHintConsumption/_isHintConsumed 存在可用', decorateOk, '');
  check('tools.ts dispatchTool 存在', dispatchToolInTools, 'src tools.ts:226');
  check('mcp-protocol.ts 源码含 _decorateResult', /\b_decorateResult\b/.test(mpSrc), 'src mcp-protocol.ts:180');
}

console.log('=====END D9-12=====');
console.log('=====SUMMARY=====');
console.log(JSON.stringify({ total: results.length, passed: results.filter((x) => x.ok).length, results }));
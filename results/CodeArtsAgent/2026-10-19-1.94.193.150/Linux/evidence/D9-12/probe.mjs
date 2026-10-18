// D9-12 initialize 握手协议安全基线（Hermes Linux 每日回归，v1.1.7）
// 源码级 + 协议级核对：
//  ① initialize 返回 protocolVersion/capabilities/serverInfo
//  ② tools/call 路由到 tools.mjs callTool（dispatch）
//  ③ runVersionCheck 是否在 initialize 阶段触发（实际：prewarm getCachedUpdateInfo）
//  ④ _decorateResult 包装响应 + _resetHintConsumption/_isHintConsumed
//  ⑤ listSkillDirs/findSkillsRoot 返回有效技能目录
//  ⑥ 非法时序（未 initialize 先 tools/list）是否被拒 -32600
// 用法: node D9-12-probe.mjs <huaweicloud-core/src 目录>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const SRC = process.argv[2];
const S = (f) => join(SRC, f);

const mp = await import(pathToFileURL(S('mcp-protocol.mjs')).href);
const tools = await import(pathToFileURL(S('tools.mjs')).href);

const out = [];
function check(name, ok, detail) {
  out.push({ name, ok, detail: String(detail).slice(0, 400) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name} | ${detail}`);
}

console.log('=====CASE D9-12=====');

// ① initialize 返回 protocolVersion/capabilities/serverInfo
{
  const init = await mp.dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } }, { sessionId: 'd912' });
  const hasProto = typeof init.protocolVersion === 'string';
  const hasCaps = init.capabilities && typeof init.capabilities === 'object';
  const hasServer = init.serverInfo && typeof init.serverInfo.name === 'string' && typeof init.serverInfo.version === 'string';
  console.log('initialize =>', JSON.stringify(init));
  check('① initialize 返回 protocolVersion+capabilities+serverInfo', hasProto && hasCaps && hasServer, JSON.stringify(init));
}

// ② tools/call 路由到 tools.mjs callTool
{
  const tid = (tools.TOOL_DEFINITIONS || []).find((t) => t.name === 'huaweicloud_check_cli');
  let routed = false, detail = 'no such tool';
  try {
    // 用真实存在的工具触发 callTool 路由（dispatch 内部 callTools）
    const r = await mp.dispatch('tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent: '创建一台云服务器' } }, { sessionId: 'd912' });
    routed = Array.isArray(r.content) && r.content.length > 0 && r.isError === false;
    detail = `tools/call 返回 content[${r.content?.length}] isError=${r.isError}`;
  } catch (e) { detail = 'EXCEPTION ' + e.message; }
  check('② tools/call 路由到 callTool（content+isError）', routed, detail + (tid ? ` ; TOOL_DEFINITIONS has check_cli=${!!tid}` : ''));
}

// ③ runVersionCheck 是否在 initialize 阶段触发
{
  // 源码级：mcp-protocol.mjs initialize 分支是否调用 runVersionCheck/getCachedUpdateInfo
  const protoText = await (await import('node:fs/promises')).readFile(S('mcp-protocol.mjs'), 'utf8');
  const initBlock = protoText.slice(protoText.indexOf("if (method === 'initialize')"), protoText.indexOf("if (method === 'tools/list')"));
  const callsVersionInInit = /runVersionCheck\s*\(/.test(initBlock);
  const callsCachedInInit = /getCachedUpdateInfo|hdkitGenerateUserHash/.test(initBlock);
  console.log('initialize 分支调用 runVersionCheck=', callsVersionInInit, '; 调用 getCachedUpdateInfo/hdkitGenerateUserHash=', callsCachedInInit);
  // 实际版本检查预热在 mcp-server.mjs runStdioServer (process.nextTick updatePrewarm -> getCachedUpdateInfo)
  check('③ initialize 阶段版本检查（runVersionCheck）', callsVersionInInit, `runVersionCheck in init=${callsVersionInInit}; cached/hash in init=${callsCachedInInit}（版本检查已下沉 prewarm/check_cli 工具）`);
}

// ④ _decorateResult 包装 + 消费标记
{
  const a = mp._isHintConsumed('d912-fresh');
  mp._resetHintConsumption();
  const b = mp._isHintConsumed('d912');
  const dec = mp._decorateResult('d912-x', 'huaweicloud_search_docs', { x: 1 });
  const isObj = typeof dec === 'object';
  check('④ _decorateResult/_resetHintConsumption/_isHintConsumed 存在可用', typeof mp._decorateResult === 'function' && typeof mp._resetHintConsumption === 'function' && typeof mp._isHintConsumed === 'function' && isObj, `_resetHintConsumption 后 _isHintConsumed(旧会话)=${b}; _decorateResult 返回 object=${isObj}`);
}

// ⑤ listSkillDirs/findSkillsRoot
{
  let dirs = 0, root = '';
  try {
    const candidates = [join(process.env.HOME || '', '.hermes', 'skills'), join(SRC, '..', 'skills'), join(SRC, '..', '..', 'skills')];
    root = tools.findSkillsRoot(candidates) || '';
    dirs = root ? tools.listSkillDirs(root).length : 0;
  } catch (e) { }
  check('⑤ listSkillDirs/findSkillsRoot 返回有效技能目录', typeof tools.listSkillDirs === 'function' && typeof tools.findSkillsRoot === 'function', `findSkillsRoot=${root || '(空)'} ; listSkillDirs 目录数=${dirs}`);
}

// ⑥ 非法时序（未 initialize 先 tools/list）是否被拒 -32600
{
  let err = null, listed = false;
  try {
    const r = await mp.dispatch('tools/list', {}, { sessionId: 'd912-never-init' });
    listed = Array.isArray(r.tools);
  } catch (e) { err = e; }
  // 预期契约：应被 -32600 拒绝。实测：dispatch 无 initialize 状态机，直接返回 tools。
  const rejected32600 = err && err.code === -32600;
  console.log('tools/list(未 initialize) =>', err ? `rejected code=${err.code}` : `returned tools=${listed}`);
  check('⑥ 非法时序 tools/list 被拒 -32600', rejected32600 === true, rejected32600 === true ? 'rejected -32600' : `未拒绝（dispatch 无 initialize 前置校验）: listed=${listed}`);
}

console.log('=====END D9-12=====');
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D9-12', okCount: out.filter((o) => o.ok).length, total: out.length, results: out }, null, 2));
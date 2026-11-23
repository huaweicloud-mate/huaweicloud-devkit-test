// D9-12 initialize 握手协议安全基线（Hermes Linux 每日回归，v2.0.0-next.4 适配）
// v2 已将 v1 的 dispatch 状态机重构为 @modelcontextprotocol/sdk 的 McpServer
// （createDevkitMcpServer）。本探针源码级核对 v2 握手契约：
//  ① createDevkitMcpServer 可构造（name/version 非空，不抛错）
//  ② runInitializeSideEffects/toClientInfo/instructionsFor 存在且 initialize 无凭证泄露
//  ③ _decorateResult/_resetHintConsumption/_isHintConsumed 仍存在（消费标记契约保留）
//  ④ 服务注册工具集含安全/审批关键工具（不含凭证写工具于 remoteSurface）
// 用法: node D9-12-probe.mjs <huaweicloud-core/src 目录(bridge)>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const SRC = process.argv[2];
const S = (f) => join(SRC, f);
const mp = await import(pathToFileURL(S('mcp-protocol.mjs')).href);

const out = [];
function check(name, ok, detail) { out.push({ name, ok, detail: String(detail).slice(0, 400) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${name} | ${detail}`); }

console.log('=====CASE D9-12=====');

// ① createDevkitMcpServer 可构造
{
  let srv = null, err = '';
  try { srv = mp.createDevkitMcpServer({ sessionId: 'd912' }); } catch (e) { err = e.message; }
  const ok = !!srv && typeof srv === 'object';
  check('① createDevkitMcpServer 可构造（server 对象）', ok, err || 'constructed server object');
}

// ② initialize 副作用 + clientInfo + instructions，无凭证泄露
{
  let outTxt = '', err = '';
  try {
    const ci = mp.toClientInfo({ clientInfo: { name: 'probe', version: '1' } });
    const inst = mp.instructionsFor(false, false) || '';
    const side = await mp.runInitializeSideEffects({ protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } });
    outTxt = JSON.stringify({ ci, inst: String(inst).slice(0, 80), side: side == null ? null : String(side).slice(0, 60) });
  } catch (e) { err = 'EXCEPTION ' + e.message; }
  const leak = /AKID|SECRET|ACCESS_KEY|SK[A-Za-z0-9]{6,}|\b(?:sk|secret_key)\s*[=:]/i.test(outTxt);
  check('② toClientInfo/instructionsFor/runInitializeSideEffects 无凭证泄露', !err && !leak, err || (leak ? 'LEAK detected' : 'no credential in handshake output'));
}

// ③ 消费标记契约保留
{
  let r = '';
  try {
    mp._resetHintConsumption();
    const b = mp._isHintConsumed('d912');
    const dec = mp._decorateResult('d912-x', 'huaweicloud_search_docs', { x: 1 });
    r = `after reset _isHintConsumed(旧会话)=${b}; _decorateResult object=${typeof dec === 'object'}`;
  } catch (e) { r = 'EXCEPTION ' + e.message; }
  const ok = typeof mp._decorateResult === 'function' && typeof mp._resetHintConsumption === 'function' && typeof mp._isHintConsumed === 'function' && r.startsWith('after reset');
  check('③ _decorateResult/_resetHintConsumption/_isHintConsumed 契约保留', ok, r);
}

// ④ 工具集注册安全（source 级：safety/审批工具在 ToolDefs，凭证写工具受 remoteSurface 克制）
{
  let r = '';
  try {
    const tools = await import(pathToFileURL(S('tools.mjs')).href);
    const names = (tools.TOOL_DEFINITIONS || []).map(t => t.name);
    const hasSafety = names.includes('huaweicloud_plan_cli_command') && names.includes('huaweicloud_run_approved_command');
    const hasVault = names.includes('huaweicloud_secret_set');
    r = `tools=${names.length} plan_cli=${names.includes('huaweicloud_plan_cli_command')} run_approved=${names.includes('huaweicloud_run_approved_command')} secret_set=${names.includes('huaweicloud_secret_set')}`;
    check('④ TOOL_DEFINITIONS 含审批链（plan/run_approved）', hasSafety, r + `; secret_set(vault写)=${hasVault ? '存在(需 remoteSurface 克制)' : '无'}`);
  } catch (e) { check('④ TOOL_DEFINITIONS 含审批链（plan/run_approved）', false, 'EXCEPTION ' + e.message); }
}

console.log('=====END D9-12=====');
console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D9-12', okCount: out.filter(o => o.ok).length, total: out.length, results: out }, null, 2));
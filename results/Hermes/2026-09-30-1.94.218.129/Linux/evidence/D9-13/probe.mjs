// D9-12 + D9-13 源码级直调探针 (v1.1.7, 今日 2026-09-29 复测)
// 只做内存级源码直调，无真云副作用。
import { dispatch, _decorateResult, _resetHintConsumption, _isHintConsumed } from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { TOOL_DEFINITIONS, callTool } from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
import * as cred from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import * as sp from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import * as re from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { hashArgs, createApprovalToken, consumeApprovalToken } from '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

const out = [];
function check(id, ok, detail) {
  out.push({ id, ok: !!ok, detail: String(detail) });
}

// ---------- D9-12 initialize 握手协议安全基线 ----------
const ires = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'hermes-probe' } });
check('d12-1', ires.protocolVersion === '2024-11-05', 'protocolVersion=' + ires.protocolVersion);
check('d12-2', ires.capabilities && 'tools' in ires.capabilities, 'capabilities=' + JSON.stringify(ires.capabilities));
check('d12-3', ires.serverInfo && /huaweicloud-devkit/.test(ires.serverInfo.name), 'serverInfo=' + JSON.stringify(ires.serverInfo));
check('d12-4', TOOL_DEFINITIONS.length >= 40, 'tools/list count=' + TOOL_DEFINITIONS.length);
let d12_illegal;
try {
  const r = await dispatch('tools/list', {}); // 未 initialize 先 tools/list
  d12_illegal = { threw: false, got: Array.isArray(r.tools) ? r.tools.length : typeof r };
} catch (e) {
  d12_illegal = { threw: true, code: e.code || e.message };
}
// 预期: 非法时序应返回 -32600；实际未拒绝 → FAIL
check('d12-illegal-timing', d12_illegal.threw && String(d12_illegal.code) === '-32600',
  '未 initialize 先 tools/list => ' + JSON.stringify(d12_illegal));
check('d12-decorate', (await _decorateResult('probe', 'x', { x: 1 })).x === 1, '_decorateResult 无 hint 兜底');
_resetHintConsumption();
check('d12-hintconsumed', _isHintConsumed('probe') === false, '_isHintConsumed 初始 false');

// ---------- D9-13 tools/call 凭证不泄露与权限校验 ----------
cred.setRuntimeCredentials('RUN_AK_0001', 'RUN_SK_0001');
check('d13-1', cred.hasRuntimeCredentials() === true, 'set+hasRuntimeCredentials');
const rres = cred.resolveCredentialsWithRuntime();
check('d13-2', rres && rres.ak === 'RUN_AK_0001', 'resolve 运行时 AK 命中=' + (rres && rres.ak));
cred.clearRuntimeCredentials();
check('d13-3', cred.hasRuntimeCredentials() === false, 'clearRuntimeCredentials 不留盘');
check('d13-4', typeof cred.isPlaceholder === 'function', 'isPlaceholder 函数存在');
const policy = sp.loadPolicy ? sp.loadPolicy() : null;
check('d13-5', policy && typeof policy === 'object', 'loadPolicy 加载');
let denyOk = false, allowOk = false;
try {
  const d = sp.classifyHcloudArgs(['ECS', 'CreateServer', '--name', 't']);
  denyOk = d && (d.decision === 'deny' || d.risk === 'write' || d.risk === 'destructive');
  const a = sp.classifyHcloudArgs(['ECS', 'ListServers']);
  allowOk = a && a.decision !== 'deny';
} catch (e) { denyOk = allowOk = false; }
check('d13-6', denyOk, 'classifyHcloudArgs 写操作 deny/write');
check('d13-7', allowOk, 'classifyHcloudArgs 只读 allow');
const red = sp.redactSecrets ? sp.redactSecrets('token=SECRETTOKEN123456 ak=AKLOWER123 sk=sklower123 adminPass=P@ss1') : null;
check('d13-8', typeof red === 'string' && !/SECRETTOKEN123456/.test(red), 'redactSecrets token 脱敏 → ' + (red ? red.slice(0,60) : red));
let hashOk = false, approveOk = false;
try {
  const h = hashArgs(['ECS', 'CreateServer', '--name', 't']);
  hashOk = typeof h === 'string' && h.length > 8;
  const tok = createApprovalToken(['ECS', 'CreateServer']);
  if (tok && consumeApprovalToken) {
    const used = consumeApprovalToken(tok);
    approveOk = (used && typeof used === 'object') || used === null || typeof used !== 'undefined';
  }
} catch (e) { hashOk = approveOk = false; }
check('d13-9', hashOk, 'hashArgs 生成参数哈希');
check('d13-10', approveOk, 'createApprovalToken/consumeApprovalToken 令牌函数存在');

const d12fails = out.filter(x => !x.ok && x.id.startsWith('d12'));
const d13fails = out.filter(x => !x.ok && x.id.startsWith('d13'));
const d12 = d12fails.length === 0 ? 'PASS' : 'FAIL';
const d13 = d13fails.length === 0 ? 'PASS' : 'FAIL';

console.log('=== D9-12 initialize 握手协议安全基线 (v1.1.7, 复测) ===');
out.filter(x => x.id.startsWith('d12')).forEach(x => console.log(`  ${x.ok?'PASS':'FAIL'}  ${x.id}  ${x.detail}`));
console.log('RESULT:', d12, d12 === 'FAIL' ? '非法时序 tools/list 未返回 -32600' : '');
console.log();
console.log('=== D9-13 tools/call 凭证不泄露与权限校验 (v1.1.7, 复测) ===');
out.filter(x => x.id.startsWith('d13')).forEach(x => console.log(`  ${x.ok?'PASS':'FAIL'}  ${x.id}  ${x.detail}`));
console.log('RESULT:', d13, '');
console.log('SUMMARY d12=' + d12 + ' d13=' + d13);
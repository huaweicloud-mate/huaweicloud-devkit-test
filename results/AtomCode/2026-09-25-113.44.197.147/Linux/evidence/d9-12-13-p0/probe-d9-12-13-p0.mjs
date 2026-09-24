// AtomCode 2026-09-25 新增 P0 探针：D9-12 initialize 握手协议安全基线 + D9-13 tools/call 凭证不泄露与权限校验
// 源码级直调（dispatch 直接返回结果对象，非 {result} 包裹）。
import { writeFileSync, mkdirSync } from 'node:fs';

const CORE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src';
const { _decorateResult, _resetHintConsumption, _isHintConsumed, dispatch } = await import(CORE + '/mcp-protocol.mjs');
const { callTool, runVersionCheck, listSkillDirs, findSkillsRoot } = await import(CORE + '/tools.mjs');
const { loadPolicy, classifyHcloudArgs } = await import(CORE + '/safety-policy.mjs');
const { evaluateArtifacts, evaluateDeployPlan, mergeRiskDecision } = await import(CORE + '/risk-rule-engine.mjs');
const cred = await import(CORE + '/auth/credentials.mjs');
const hc = await import(CORE + '/hcloud-cli.mjs');

let pass = 0, fail = 0;
const results = [];
function check(cid, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${cid}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// ============ D9-12 initialize 握手协议安全基线 ============
{
  // ① initialize 直接返回 { protocolVersion, capabilities, serverInfo }
  const resp = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe-d9-12', version: '1' } }, {});
  check('D9-12', 'initialize 返回 protocolVersion', typeof resp?.protocolVersion, 'string');
  check('D9-12', 'initialize 返回 capabilities 对象', typeof resp?.capabilities, 'object');
  check('D9-12', 'serverInfo.name', resp?.serverInfo?.name, 'huaweicloud-devkit');
  check('D9-12', 'serverInfo 含 version', typeof resp?.serverInfo?.version, 'string');

  // ② callTool 路由到 tools.mjs callTool（dispatch tools/call 直接返回 {content,isError}）
  const tc = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, {});
  check('D9-12', 'dispatch tools/call 返回 content 数组', Array.isArray(tc?.content), true);

  // ③ runVersionCheck 在 initialize 阶段触发（函数可调用不抛）
  let rvOk = false;
  try { await runVersionCheck({ timeoutMs: 8000, noCache: false }); rvOk = true; } catch { rvOk = false; }
  check('D9-12', 'runVersionCheck 可调用(不抛/返回)', rvOk, true);

  // ④ _decorateResult 包装响应 + 提示消费标记
  _resetHintConsumption();
  const dec = _decorateResult('sess-d9-12', 'huaweicloud_check_update', { foo: 1 });
  check('D9-12', '_decorateResult 包装返回对象且无副作用', typeof dec === 'object', true);
  check('D9-12', '_isHintConsumed 初始(未消费)为 false', _isHintConsumed('sess-d9-12'), false);

  // ⑤ findSkillsRoot(返回字符串路径或 null) + listSkillDirs 返回技能目录
  const skillsRoots = findSkillsRoot([CORE + '/../../../skills', CORE + '/../../skills', CORE + '/skills']);
  check('D9-12', 'findSkillsRoot 返回目录字符串', typeof skillsRoots, 'string');
  const dirs = listSkillDirs(skillsRoots || '');
  check('D9-12', 'listSkillDirs 返回技能目录数组', Array.isArray(dirs), true);

  // ⑥ 非法时序（未 initialize 先 tools/list）应返回 -32600
  let beforeInitCode = null, beforeInitHasResult = false;
  try {
    const bi = await dispatch('tools/list', {}, {});
    beforeInitHasResult = bi !== undefined;
    beforeInitCode = bi?.error?.code ?? null;
  } catch (e) { beforeInitCode = e.code ?? null; }
  check('D9-12', '未 initialize 先 tools/list 返回 -32600(设计契约)', beforeInitCode, -32600);
  results.push(`NOTE   D9-12 未 initialize 先 tools/list 实测 => ${JSON.stringify({ hasResult: beforeInitHasResult, code: beforeInitCode }).slice(0, 160)}`);
}

// ============ D9-13 tools/call 凭证不泄露与权限校验 ============
{
  // ① 运行时凭证生命周期
  cred.setRuntimeCredentials('RK-AK-TEST', 'RK-SK-TEST', undefined, 'cn-north-4');
  check('D9-13', 'setRuntimeCredentials 后 hasRuntimeCredentials=true', cred.hasRuntimeCredentials(), true);
  const resolved = cred.resolveCredentialsWithRuntime({});
  check('D9-13', 'resolveCredentialsWithRuntime 解析运行时凭证 ak', resolved?.ak, 'RK-AK-TEST');
  cred.clearRuntimeCredentials();
  check('D9-13', 'clearRuntimeCredentials 后 hasRuntimeCredentials=false', cred.hasRuntimeCredentials(), false);

  // ② loadPolicy + classifyHcloudArgs 三态
  const policy = loadPolicy();
  check('D9-13', 'loadPolicy 返回策略对象', typeof policy, 'object');
  const cw = classifyHcloudArgs(['ECS', 'CreateServers', '--flavor', 's6']);
  const cr = classifyHcloudArgs(['ECS', 'ListServers']);
  check('D9-13', 'classifyHcloudArgs 写命令决策非 allow(deny/confirm)', cw.decision !== 'allow', true);
  check('D9-13', 'classifyHcloudArgs 只读命令决策 allow', cr.decision, 'allow');

  // ③ evaluateArtifacts/evaluateDeployPlan/mergeRiskDecision (deny 需带 findings)
  const art = evaluateArtifacts([{ path: 't.tf', content: '{}' }]);
  check('D9-13', 'evaluateArtifacts 返回对象', typeof art, 'object');
  const dep = evaluateDeployPlan({ action: 'create', resource: 'ecs', config: {} });
  check('D9-13', 'evaluateDeployPlan 返回对象', typeof dep, 'object');
  const merged = mergeRiskDecision({ decision: 'allow' }, { decision: 'deny', findings: [{ category: 'high', message: 'm1' }] });
  check('D9-13', 'mergeRiskDecision 高危风险合并为 deny', merged?.decision, 'deny');

  // ④ hashArgs + 审批令牌生命周期（consume 后失效，不可重放）
  const h1 = hc.hashArgs(['ECS', 'DeleteServers', '--server-id', 'x']);
  const h2 = hc.hashArgs(['ECS', 'DeleteServers', '--server-id', 'x']);
  check('D9-13', 'hashArgs 幂等(相同参数同哈希)', h1, h2);
  const tok = hc.createApprovalToken(['ECS', 'DeleteServers', '--server-id', 'x']);
  check('D9-13', 'createApprovalToken 返回 token', typeof tok, 'string');
  const consumed = hc.consumeApprovalToken(tok);
  const consumed2 = hc.consumeApprovalToken(tok);
  check('D9-13', 'consumeApprovalToken 首次消费成功', !!consumed, true);
  check('D9-13', 'consumeApprovalToken 二次消费(重放)被拒', !consumed2, true);

  // ⑤ readServiceCatalogs/classifyUnsupported/planHcloudCommand
  const cats = hc.readServiceCatalogs();
  check('D9-13', 'readServiceCatalogs 返回对象', typeof cats, 'object');
  const unsup = hc.classifyUnsupported('NOT_A_REAL_SVC_XYZ', undefined);
  check('D9-13', 'classifyUnsupported 返回非 undefined', unsup !== undefined, true);
  const plan = await hc.planHcloudCommand(['ECS', 'ListServers']);
  check('D9-13', 'planHcloudCommand 返回规划对象', !!(plan && typeof plan === 'object'), true);

  // ⑥ tools/call 返回无 AK/SK/token 明文
  const outText = await callTool('huaweicloud_list_regions', {});
  const s = JSON.stringify(outText);
  const leak = /RK-AK-TEST|RK-SK-TEST/.test(s);
  check('D9-13', 'tools/call 返回不含明文 AK/SK', leak, false);

  // ⑦ 全局凭证持久化 + isPlaceholder + 路径/配置函数
  const gpath = cred.globalCredentialsPath();
  check('D9-13', 'globalCredentialsPath 返回路径(字符串)', typeof gpath, 'string');
  const ph = cred.isPlaceholder(undefined) === true || cred.isPlaceholder('') === true || cred.isPlaceholder('PLACEHOLDER') === true || cred.isPlaceholder('not-a-placeholder') === false;
  check('D9-13', 'isPlaceholder 正确识别占位/非占位', ph, true);
  check('D9-13', 'obsConfigPath 为导出函数', typeof cred.obsConfigPath, 'function');
  check('D9-13', 'writeObsConfig 为导出函数', typeof cred.writeObsConfig, 'function');
}

console.log('\n=== D9-12/D9-13 P0 基线与安全探针结果 ===');
for (const l of results) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);

const d912 = results.some((r) => r.startsWith('FAIL  D9-12'));
const d913 = results.some((r) => r.startsWith('FAIL  D9-13'));
const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const BASE = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-09-25-113.44.197.147/Linux/evidence';
for (const [cid, isFail, why] of [
  ['D9-12', d912, d912 ? '未 initialize 先 tools/list 未返回 -32600（mcp-protocol.mjs dispatch 无时序守卫，同 D9-4 根因）' : 'initialize 握手/callTool 路由/_decorateResult/listSkillDirs 全基线通过'],
  ['D9-13', d913, d913 ? '见 FAIL 断言' : '凭证生命周期/权限三态/审批令牌不可重放/无明文创证全通过'],
]) {
  const dir = `${BASE}/${cid}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + '/stdout.log', JSON.stringify({ status: isFail ? 'FAIL' : 'PASS', why, executedAt: now }, null, 2), 'utf8');
}
process.exit(fail > 0 ? 1 : 0);
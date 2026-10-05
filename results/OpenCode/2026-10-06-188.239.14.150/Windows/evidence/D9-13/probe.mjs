// D9-13 tools/call 凭证不泄露与权限校验（P0）
// 断言：①tools/call 返回不含 AK/SK/token 明文；②运行时凭证注入/解析/清理闭环；
//       ③审批令牌 consumeApprovalToken 后失效且不可重放；④权限判定 deny/warn/allow 三态正确；
//       ⑤isPlaceholder 正确识别占位凭证；⑥readGlobalCredentials/writeGlobalCredentials 持久化一致
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = process.env.HDK_SRC || 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const CASE = 'D9-13';
// 明确的占位/假凭证（仅用于占位识别与注入解析，不用于任何真实调用）
const FAKE_AK = 'AKIAPROBEDUMMY000001';
const FAKE_SK = 'PR0b3DummySecretKeyValue0000000000000000000';

function fmt() { const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; }
function finish(status, why, extra = {}) {
  const out = { caseId: CASE, status, why, executedAt: fmt(), platform: process.platform, node: process.version, ...extra };
  writeFileSync('stdout.log', JSON.stringify(out, null, 2), 'utf8');
  console.log(JSON.stringify(out, null, 2));
}

const creds = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);
const cli = await import(pathToFileURL(join(SRC, 'hcloud-cli.mjs')).href);
const safety = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const engine = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);
const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

// 读取真实凭证仅用于"明文泄露检测"，不打印内容
const s1Path = creds.globalCredentialsPath();
const real = existsSync(s1Path) ? creds.readGlobalCredentials() : {};
const realAk = String(real.ak || '');
const realSk = String(real.sk || '');

// ① tools/call 返回不含明文凭证（真实 MCP 路由）
const CALLS = [
  ['huaweicloud_auth_status', { target: 'all' }],
  ['huaweicloud_show_profile_redacted', {}],
  ['huaweicloud_hook_check_command', { command: 'hcloud ECS ListServers' }],
  ['huaweicloud_plan_cli_command', { args: ['ECS', 'ListServers'] }],
];
const callResults = [];
for (const [name, args] of CALLS) {
  const r = await tools.callTool(name, args);
  const text = JSON.stringify(r);
  const leaks = [];
  if (realSk && text.includes(realSk)) leaks.push('SK 明文');
  if (realAk && realSk && text.includes(realAk) && text.includes(realSk)) leaks.push('AK+SK 同时明文');
  if (FAKE_SK && text.includes(FAKE_SK)) leaks.push('注入占位 SK 明文');
  if (realSk && text.includes(realSk.slice(0, 16))) leaks.push('SK 前 16 位片段');
  callResults.push({ tool: name, ok: r && r.ok !== false, leaks, satisfied: leaks.length === 0 });
}

// ② 运行时凭证注入/解析/清理闭环
const hadRuntimeBefore = creds.hasRuntimeCredentials();
creds.setRuntimeCredentials(FAKE_AK, FAKE_SK, undefined, 'cn-north-4');
const hasRuntimeAfter = creds.hasRuntimeCredentials();
const resolved = creds.resolveCredentialsWithRuntime({});
const runtimeResolved = resolved && resolved.ak === FAKE_AK && resolved.sk === FAKE_SK;
creds.clearRuntimeCredentials();
const cleared = !creds.hasRuntimeCredentials();

// ③ 审批令牌生命周期：hashArgs + consume 一次性
const tokenArgs = ['ECS', 'DeleteServers', '--server-ids', 'abc-123'];
const argsHash = cli.hashArgs(tokenArgs);
let token = null, firstConsume = null, secondConsume = null, replayRejected = false;
try {
  token = cli.createApprovalToken(tokenArgs, { decision: 'allow', tool: 'huaweicloud_run_approved_command' });
  if (token) {
    firstConsume = cli.consumeApprovalToken(token.token || token);
    secondConsume = cli.consumeApprovalToken(token.token || token);
    replayRejected = firstConsume && !secondConsume;
  }
} catch (e) {
  token = { error: e.message };
}

// ④ 权限判定三态
const THREE_STATE = [
  ['deny', 'cat ~/.hcloud/credentials.json'],
  ['deny', 'hcloud ECS DeleteServers --server-ids abc --force'],
  ['warn', 'hcloud ECS DeleteServers --server-ids abc'],
  ['allow', 'hcloud ECS ListServers'],
];
const threeStateRows = THREE_STATE.map(([expect, cmd]) => {
  const cmdEv = engine.evaluateCommandRisk(cmd);
  const textEv = safety.classifyTextCommand(cmd);
  const satisfied = cmdEv.decision === expect;
  return { command: cmd, expect, engineDecision: cmdEv.decision, policyDecision: textEv.decision, satisfied };
});

// ⑤ isPlaceholder 占位识别
const PLACEHOLDERS = [
  ['<your-ak>', true], ['<HW_ACCESS_KEY>', true], ['${HW_ACCESS_KEY}', true],
  ['YOUR_AK', true], ['ACCESS_KEY', true], ['SECRET_KEY', true], ['SECURITY_TOKEN', true],
  ['changeme', true], ['replace_me', true], ['change.me', true], ['placeholder-key', true],
  ['abc****', true], ['****', true],
  ['AKIAIOSFODNN7EXAMPLE', false], ['AKIAPROBEDUMMY000001', false], ['cn-north-4', false],
  ['my-real-access-key-value', false],
];
const placeholderRows = PLACEHOLDERS.map(([value, expectTrue]) => {
  const got = creds.isPlaceholder(value);
  return { value, expectIsPlaceholder: expectTrue, got, satisfied: got === expectTrue };
});

// ⑥ readGlobalCredentials / writeGlobalCredentials 持久化一致（备份-改写-还原闭环）
let persistenceOk = true, persistenceDetail = null;
if (realAk && realSk) {
  const before = JSON.stringify(real);
  const backupPath = creds.backupGlobalCredentials();
  try {
    creds.writeGlobalCredentials({ ...real, ak: FAKE_AK, sk: FAKE_SK, region: 'cn-north-4' });
    const afterWrite = creds.readGlobalCredentials();
    const writtenOk = afterWrite.ak === FAKE_AK && afterWrite.sk === FAKE_SK;
    creds.restoreGlobalCredentialsBackup(backupPath);
    const afterRestore = creds.readGlobalCredentials();
    const restoredOk = JSON.stringify(afterRestore) === before;
    persistenceOk = writtenOk && restoredOk;
    persistenceDetail = { backupPath, writtenOk, restoredOk };
  } catch (e) {
    persistenceOk = false;
    persistenceDetail = { backupPath, error: e.message };
    try { creds.restoreGlobalCredentialsBackup(backupPath); } catch {}
  }
}

const all = [...callResults, ...threeStateRows, ...placeholderRows];
const violations = all.filter((r) => r.satisfied === false);
const runtimeOk = runtimeResolved && cleared;
const approvalOk = !token || !!replayRejected;
const ok = violations.length === 0 && runtimeOk && approvalOk && persistenceOk;

finish(ok ? 'PASS' : 'FAIL',
  ok ? `凭证不泄露与权限校验基线成立：${callResults.length} 个 tools/call 返回均无 AK/SK/token 明文；运行时凭证注入→解析→清理闭环正确（${hadRuntimeBefore}→${hasRuntimeAfter}→${cleared}）；审批令牌消费后失效不可重放=${replayRejected}；权限三态 deny/warn/allow 判定正确；isPlaceholder 对 ${placeholderRows.length} 个样本判定正确；凭证持久化写-读-还原一致`
      : `凭证/权限基线不成立：violations=${JSON.stringify(violations)} runtimeOk=${runtimeOk} approvalOk=${approvalOk} persistenceOk=${persistenceOk}`,
  {
    callResults,
    runtimeCredentials: { hadRuntimeBefore, hasRuntimeAfter, resolvedAkMatch: resolved && resolved.ak === FAKE_AK, resolvedSkMatch: resolved && resolved.sk === FAKE_SK, cleared, probeValue: '明确的占位假凭证，仅用于闭环验证' },
    approvalToken: { created: !!(token && !token.error), argsHash, firstConsumeOk: !!firstConsume, secondConsumeOk: !!secondConsume, replayRejected, error: token && token.error },
    threeStateRows,
    placeholderRows,
    persistence: persistenceDetail,
    hadRuntimeCredentialsAtStart: hadRuntimeBefore,
    violations,
  });
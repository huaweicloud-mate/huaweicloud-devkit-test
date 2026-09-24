// 2026-09-25 OpenClaw Linux — D9-13 tools/call 凭证不泄露与权限校验 源码级探针
// ① setRuntimeCredentials/hasRuntimeCredentials/resolveCredentialsWithRuntime 运行时凭证
// ② loadPolicy + classifyHcloudArgs 命令分类三态
// ③ evaluateArtifacts/evaluateDeployPlan + mergeRiskDecision 风险合并
// ④ hashArgs + createApprovalToken/consumeApprovalToken 审批令牌不可重放
// ⑤ readServiceCatalogs/classifyUnsupported/planHcloudCommand 命令分类
// ⑥ tools/call 返回无 AK/SK/token 明文
// ⑦ clearRuntimeCredentials 清理后不留盘（hasRuntimeCredentials=false）
// ⑧ readGlobalCredentials/writeGlobalCredentials 持久化一致 + isPlaceholder
// ⑨ globalCredentialsPath/obsConfigPath/writeObsConfig 路径与配置核对
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CORE = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const cred = await import(CORE + '/auth/credentials.mjs');
const sp = await import(CORE + '/safety-policy.mjs');
const rre = await import(CORE + '/risk-rule-engine.mjs');
const hc = await import(CORE + '/hcloud-cli.mjs');
const tools = await import(CORE + '/tools.mjs');

let pass = 0, fail = 0;
const lines = [];
function check(id, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  lines.push(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function note(m) { lines.push(`NOTE   ${m}`); }

// 隔离 HOME，避免污染真实 credentials.json
const isoHome = mkdtempSync(join(tmpdir(), 'hdk-d9-13-'));
const realHome = process.env.HUAWEICLOUD_HOME;

// ① 运行时凭证
{
  cred.setRuntimeCredentials('AK_TEST_RUNTIME_1234567890', 'SK_TEST_RUNTIME_SECRET_0987654321', 'tok123', 'cn-north-4');
  check('D9-13', 'setRuntimeCredentials 后 hasRuntimeCredentials=true', cred.hasRuntimeCredentials(), true);
  const r = cred.resolveCredentialsWithRuntime();
  check('D9-13', 'resolveCredentialsWithRuntime 返回运行时 ak', r.ak === 'AK_TEST_RUNTIME_1234567890', true);
  check('D9-13', 'resolveCredentialsWithRuntime 返回运行时 sk', r.sk === 'SK_TEST_RUNTIME_SECRET_0987654321', true);
  check('D9-13', 'resolveCredentialsWithRuntime 返回 securityToken', r.securityToken === 'tok123', true);

  // ⑦ clearRuntimeCredentials 清理
  cred.clearRuntimeCredentials();
  check('D9-13', 'clearRuntimeCredentials 后 hasRuntimeCredentials=false', cred.hasRuntimeCredentials(), false);
}

// ② loadPolicy + classifyHcloudArgs 三态
{
  const policy = sp.loadPolicy();
  check('D9-13', 'loadPolicy 返回对象含 secretKeyNamePatterns', Array.isArray(policy?.secretKeyNamePatterns) && policy.secretKeyNamePatterns.length > 0, true);
  const readOnly = sp.classifyHcloudArgs(['ECS', 'DescribeInstances']);
  const write = sp.classifyHcloudArgs(['ECS', 'DeleteServers', '--servers.0.id', 'x']);
  const denyCmd = sp.classifyHcloudArgs(['ECS', 'DeleteServers', '--force']);
  note(`D9-13 classify readOnly=${readOnly.decision} write=${write.decision} force=${denyCmd.decision}`);
  check('D9-13', 'classifyHcloudArgs 只读 → allow', readOnly.decision, 'allow');
  check('D9-13', 'classifyHcloudArgs 写(无审批) → deny', ['deny', 'warn'].includes(write.decision), true);
  check('D9-13', 'classifyHcloudArgs 破坏性(--force) → deny', ['deny', 'warn'].includes(denyCmd.decision), true);
}

// ③ evaluateArtifacts/evaluateDeployPlan + mergeRiskDecision
{
  const af = rre.evaluateArtifacts([{ path: 'main.tf', content: 'resource "huaweicloud_iam_role" "r" { }' }]);
  const dp = rre.evaluateDeployPlan({ plan: 'open 0.0.0.0/0 port 22 to public + ECS admin password in plaintext' });
  check('D9-13', 'evaluateArtifacts 返回 findings 数组', Array.isArray(af?.findings), true);
  check('D9-13', 'evaluateDeployPlan 返回 findings 数组', Array.isArray(dp?.findings), true);
  const merged = rre.mergeRiskDecision({ decision: 'allow' }, { decision: 'deny', findings: [{ ruleId: 'x' }] });
  note(`D9-13 mergeRiskDecision=${merged.decision}`);
  check('D9-13', 'mergeRiskDecision 合并为 deny(高优先级)', merged.decision, 'deny');
}

// ④ hashArgs + 审批令牌不可重放
{
  const h1 = hc.hashArgs(['ECS', 'DeleteServers', '--servers.0.id', 'x']);
  const h2 = hc.hashArgs(['ECS', 'DeleteServers', '--servers.0.id', 'x']);
  const h3 = hc.hashArgs(['ECS', 'DeleteServers', '--servers.0.id', 'y']);
  check('D9-13', 'hashArgs 同参数确定性(相同哈希)', h1 === h2 && typeof h1 === 'string', true);
  check('D9-13', 'hashArgs 不同参数哈希不同', h1 !== h3, true);

  const token = hc.createApprovalToken(['ECS', 'DeleteServers', '--servers.0.id', 'x']);
  check('D9-13', 'createApprovalToken 返回非空 token', typeof token === 'string' && token.length > 0, true);
  const consumed = hc.consumeApprovalToken(token);
  check('D9-13', 'consumeApprovalToken 首次消费返回 entry(含 argsHash)', !!consumed && consumed.argsHash === h1, true);
  const replay = hc.consumeApprovalToken(token);
  check('D9-13', 'consumeApprovalToken 二次消费返回 null(不可重放)', replay === null, true);
}

// ⑤ readServiceCatalogs / classifyUnsupported / planHcloudCommand
{
  const cats = hc.readServiceCatalogs?.();
  // readServiceCatalogs 返回缓存对象 {dir,t,cn:Set,en:Set,cnPresent,enPresent}
  const catsShape = !!cats && cats.cn instanceof Set && cats.en instanceof Set && typeof cats.dir === 'string';
  note(`D9-13 readServiceCatalogs => dir=${cats?.dir ? '有' : '无'} cn=Set(${cats?.cn?.size ?? 0}) en=Set(${cats?.en?.size ?? 0})`);
  check('D9-13', 'readServiceCatalogs 返回目录缓存(cn/en 为 Set)', catsShape, true);
  const unsup = hc.classifyUnsupported?.('NoSuchService');
  note(`D9-13 classifyUnsupported(NoSuchService)=${JSON.stringify(unsup).slice(0, 80)}`);
  check('D9-13', 'classifyUnsupported 返回字符串分类(unknown/other 等)', typeof unsup === 'string' && unsup.length > 0, true);
  const plan = await hc.planHcloudCommand(['ECS', 'DescribeInstances']);
  note(`D9-13 planHcloudCommand(DescribeInstances) keys=${Object.keys(plan || {}).join(',')}`);
  check('D9-13', 'planHcloudCommand 返回 classification 分类(safeToRun 布尔)', !!plan && typeof plan.classification === 'object' && typeof plan.safeToRun === 'boolean', true);
}

// ⑥ tools/call 返回无 AK/SK/token 明文
{
  cred.setRuntimeCredentials('AK_TEST_RUNTIME_1234567890', 'SK_TEST_RUNTIME_SECRET_0987654321', 'tok-abc-xyz', 'cn-north-4');
  const resp = await tools.callTool('huaweicloud_show_profile_redacted', {});
  const text = JSON.stringify(resp);
  const leakedAk = text.includes('AK_TEST_RUNTIME_1234567890');
  const leakedSk = text.includes('SK_TEST_RUNTIME_SECRET_0987654321');
  const leakedTok = text.includes('tok-abc-xyz');
  note(`D9-13 tools/call 输出含AK=${leakedAk} 含SK=${leakedSk} 含token=${leakedTok}`);
  check('D9-13', 'tools/call 返回不含 AK 明文', leakedAk, false);
  check('D9-13', 'tools/call 返回不含 SK 明文', leakedSk, false);
  check('D9-13', 'tools/call 返回不含 token 明文', leakedTok, false);
  cred.clearRuntimeCredentials();
}

// ⑧ 持久化一致 + isPlaceholder（隔离 HOME）
{
  process.env.HUAWEICLOUD_HOME = isoHome;
  const credPath = cred.globalCredentialsPath();
  check('D9-13', 'globalCredentialsPath 指向隔离 HOME', credPath.startsWith(isoHome), true);
  const written = cred.writeGlobalCredentials({ ak: 'AK_ISO_123456', sk: 'SK_ISO_SECRET', region: 'cn-north-4' });
  const read = cred.readGlobalCredentials();
  check('D9-13', 'writeGlobalCredentials 后 readGlobalCredentials 读回一致', read?.ak === 'AK_ISO_123456' && read?.sk === 'SK_ISO_SECRET', true);
  check('D9-13', '写盘文件权限私有(0600)', (() => { try { const m = statSync(credPath).mode & 0o777; return m === 0o600; } catch { return false; } })(), true);

  check('D9-13', 'isPlaceholder("<HW_ACCESS_KEY>")=true', cred.isPlaceholder('<HW_ACCESS_KEY>'), true);
  check('D9-13', 'isPlaceholder("${SECRET_KEY}")=true', cred.isPlaceholder('${SECRET_KEY}'), true);
  check('D9-13', 'isPlaceholder("YOUR_AK")=true', cred.isPlaceholder('YOUR_AK'), true);
  check('D9-13', 'isPlaceholder("ab12cd****")=true(掩码)', cred.isPlaceholder('ab12cd****'), true);
  check('D9-13', 'isPlaceholder("")=false', cred.isPlaceholder(''), false);
  check('D9-13', 'isPlaceholder("真实22位AK")=false', cred.isPlaceholder('AK_TEST_RUNTIME_1234567890'), false);
}

// ⑨ obsConfigPath / writeObsConfig
{
  process.env.HCLOUD_OBS_CONFIG_PATH = join(isoHome, '.obsutilconfig-iso');
  const ocp = cred.obsConfigPath();
  check('D9-13', 'obsConfigPath 尊重 HCLOUD_OBS_CONFIG_PATH 注入', ocp === join(isoHome, '.obsutilconfig-iso'), true);
  const wrote = cred.writeObsConfig({ ak: 'AK_OBS', sk: 'SK_OBS', region: 'cn-north-4' });
  const content = readFileSync(wrote.path, 'utf8');
  check('D9-13', 'writeObsConfig 写 endpoint/ak/sk', /endpoint=https:\/\/obs\.cn-north-4\.myhuaweicloud\.com/.test(content) && /^ak=AK_OBS$/m.test(content) && /^sk=SK_OBS$/m.test(content), true);
  let threw = false;
  try { cred.writeObsConfig({ ak: '', sk: '', region: '' }); } catch (e) { threw = true; }
  check('D9-13', 'writeObsConfig 缺 region/ak/sk 抛错', threw, true);
}

// 清理
delete process.env.HCLOUD_OBS_CONFIG_PATH;
if (realHome === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = realHome;
rmSync(isoHome, { recursive: true, force: true });

console.log('\n=== OpenClaw Linux D9-13 tools/call 凭证不泄露与权限校验 探针结果 (2026-09-25) ===');
for (const l of lines) console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
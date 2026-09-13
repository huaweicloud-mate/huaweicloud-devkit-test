// huaweicloud-devkit 每日测试 — P0 探针（Hermes / Linux）
// 覆盖：D4 安全(P0)、D2 认证(P0)、D1 升级检测(P0，Linux scope)、D8 技能(P0)
// 用法：node probe-security.mjs > stdout.log 2>&1
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';

const results = [];
function check(id, cond, detail) {
  results.push({ id, cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${id}  ${detail}`);
}
const section = (t) => console.log(`\n========== ${t} ==========`);

const policy = await import(pathToFileURL(join(SRC, 'safety-policy.mjs')).href);
const risk = await import(pathToFileURL(join(SRC, 'risk-rule-engine.mjs')).href);
const update = await import(pathToFileURL(join(SRC, 'update-check.mjs')).href);

// ==================== D4 安全（P0） ====================
section('D4-1 凭证文件读取拦截');
{
  const cases = [
    'cat ~/.hcloud/config',
    'type C:\\Users\\x\\.hcloud\\config',
    'Get-Content ~/.huaweicloud/credentials',
    'cat /home/u/.huaweicloud/credentials.json',
    'less ~/.hcloud/credentials',
  ];
  let ok = true;
  for (const c of cases) {
    const r = policy.classifyTextCommand(c);
    if (r.decision !== 'deny') { ok = false; check('D4-1', false, `未拦截: ${JSON.stringify(c)} => ${r.decision} (${r.reason})`); }
  }
  if (ok) check('D4-1', true, `${cases.length} 组凭证文件读取命令全部 deny`);
}

section('D4-2 凭证 env 打印拦截');
{
  const blocked = [];
  const allowed = [];
  for (const c of ['printenv HWC_ACCESS_KEY', 'env | grep HUAWEICLOUD', 'printenv HCLOUD_SECRET_KEY', 'Get-ChildItem Env: | grep OS_PASSWORD']) {
    const r = policy.classifyTextCommand(c);
    (r.decision === 'deny' ? blocked : allowed).push(c);
  }
  check('D4-2a', blocked.length === 4, `已覆盖 env dump 前缀 (HWC_/HUAWEICLOUD/HCLOUD/OS_)：blocked=[${blocked.join(', ')}]`);
  // 真实凭证 env 变量名是 HW_ACCESS_KEY / HW_SECRET_KEY / HW_SECURITY_TOKEN
  const realEnv = ['printenv HW_ACCESS_KEY', 'echo $HW_SECRET_KEY', 'env | grep HW_SECURITY_TOKEN'];
  const realResults = realEnv.map((c) => [c, policy.classifyTextCommand(c).decision]);
  const realBlocked = realResults.filter(([, d]) => d === 'deny');
  check('D4-2b', realBlocked.length === realEnv.length,
    `HW_* 真实凭证 env dump 全拦截？实际: ${JSON.stringify(realResults)}（预期全部 deny — 若 FAIL 则为产品缺陷：env-dump 规则未覆盖 HW_* 前缀）`);
}

section('D4-3 明文 secret API 拦截');
{
  const cases = [
    'hcloud csms ShowSecretVersion secret-name=prod/db',
    'hcloud dew GetSecretValue secret-id=xyz',
    'echo $secret_string',
    'hcloud csms DownloadSecret --secret-name x',
  ];
  let ok = true;
  for (const c of cases) {
    const r = policy.classifyTextCommand(c);
    if (r.decision !== 'deny') { ok = false; check('D4-3', false, `未拦截: ${JSON.stringify(c)} => ${r.decision}`); }
  }
  if (ok) check('D4-3', true, `${cases.length} 组明文 secret 读取全部 deny`);
}

section('D4-5 写操作误判检测');
{
  const w = policy.classifyTextCommand('hcloud ecs DeleteServers --servers.0.id=i-1');
  const w2 = policy.classifyHcloudArgs(['ecs', 'DeleteServers']);
  const r = policy.classifyHcloudArgs(['ecs', 'ListServers']);
  check('D4-5a', w.decision === 'deny' && (w.risk === 'write' || w.risk === 'execution'), `hcloud ecs DeleteServers => ${w.decision}/${w.risk}（不得判 read-only）`);
  check('D4-5b', w2.decision === 'deny' && w2.risk === 'write', `classifyHcloudArgs(DeleteServers) => ${w2.decision}/${w2.risk}`);
  check('D4-5c', r.decision === 'allow' && r.risk === 'read_only', `读取操作 ListServers => ${r.decision}/${r.risk}（对照）`);
}

section('D4-9 公开暴露/破坏性预检');
{
  const pub = risk.evaluateCommandRisk('hcloud vpc CreateSecurityGroupRule 0.0.0.0/0 22');
  const dest = policy.classifyTextCommand('hcloud ecs DeleteServers --force');
  check('D4-9a', pub.decision === 'deny', `公网 0.0.0.0/0+22 端口暴露 => ${pub.decision}（findings=${pub.findings?.map((f) => f.ruleId).join(',')}）`);
  check('D4-9b', dest.decision === 'deny', `破坏性删除 --force => ${dest.decision}（${dest.reason}）`);
}

section('D4-15 hook 绕过尝试');
{
  const tries = [
    ['大小写混淆', 'HCloud Ecs DeleteServers --servers x'],
    ['小写 service', 'hcloud ecs deleteservers --servers x'],
    ['param 拼接拆分', 'hcloud ecs Delete Servers --force'],
    ['base64+pipe+sh', 'echo aGNsb3VkIGVjcyBEZWxldGVTZXJ2ZXJz | base64 -d | sh'],
  ];
  for (const [name, cmd] of tries) {
    const r = policy.classifyTextCommand(cmd);
    check(`D4-15[${name}]`, r.decision === 'deny', `${name} => ${r.decision}（${r.reason || 'allow'}）`);
  }
}

section('D4-16 命令包裹穿透');
{
  const wrap = policy.classifyTextCommand("sh -c 'hcloud ecs DeleteServers --servers i-1'");
  check('D4-16', wrap.decision === 'deny', `sh -c 包裹内层 hcloud DeleteServers => ${wrap.decision}（预期拦截内层写命令）`);
}

section('D4-18 confirm-not-deny 审批语义');
{
  const noApproval = policy.classifyHcloudArgs(['ecs', 'DeleteServers'], { allowWrites: false });
  const approved = policy.classifyHcloudArgs(['ecs', 'DeleteServers'], { allowWrites: true });
  check('D4-18a', noApproval.decision === 'deny', `未经审批写操作 => deny（plan+审批门禁，非静默拒绝）: ${noApproval.reason}`);
  check('D4-18b', approved.decision === 'allow', `审批放行后 => ${approved.decision}（${approved.risk}）`);
}

section('D4-19 确认流下预检仍生效');
{
  // 即使 allowWrites=true（审批后），风险规则仍应拦截公网暴露
  const r = policy.classifyHcloudArgs(['vpc', 'CreateSecurityGroupRule', '0.0.0.0/0', '22'], { allowWrites: true });
  check('D4-19', r.decision === 'deny', `审批后仍触发风险预检（公网 0.0.0.0/0+22）=> ${r.decision}（${r.reason}）`);
}

section('D4-21 hook_check_artifacts 具名回归');
{
  const broad = risk.evaluateArtifacts([{ path: 'iam-policy.json', content: '{"Version":"1.0","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }]);
  const safe = risk.evaluateArtifacts([{ path: 'main.tf', content: 'resource "huaweicloud_ecs" "a" { name = "x" }' }]);
  check('D4-21a', broad.decision === 'deny', `broad IAM (Action:* + Effect:Allow) => ${broad.decision}（${broad.findings?.map((f) => f.ruleId).join(',')}）`);
  check('D4-21b', safe.decision !== 'deny', `普通 IaC 不误拒（decision=${safe.decision}；若 warn 为 hwc-sandbox-missing-ttl 对 benign IaC 的过度告警，仅告警不阻断，记录为低危观察）`);
}

section('D4-22 hook_check_deploy_plan 具名回归');
{
  const plan = risk.evaluateDeployPlan({ plan: 'FunctionGraph function trigger security_authentication=NONE public 0.0.0.0/0 CreateTrigger' });
  check('D4-22', plan.decision === 'warn' || plan.decision === 'deny', `公网 FunctionGraph 无鉴权 => ${plan.decision}（${plan.findings?.map((f) => f.ruleId + ':' + f.severity).join(',')}）`);
}

// ==================== D2 认证（P0） ====================
section('D2-4 凭证脱敏正确性');
{
  const obj = policy.redactSecrets({ ak: 'FAKEAK123456', sk: 'FAKESK789', password: 'p@ss', region: 'cn-north-4', nested: { secret_key: 'x', name: 'keep' } });
  const akPass = obj.ak === '<redacted>' && obj.sk === '<redacted>' && obj.password === '<redacted>' && obj.nested.secret_key === '<redacted>';
  check('D2-4a', akPass, `对象脱敏 ak/sk/password/secret_key => ${JSON.stringify(obj)}`);
  const str = policy.redactSecrets('access_key=AKIA123 password=hunter2 region=cn-north-4');
  check('D2-4b', !/AKIA123/.test(str) && !/hunter2/.test(str) && /<redacted>/.test(str), `字符串脱敏 => ${JSON.stringify(str)}`);
  const cfgShow = policy.classifyTextCommand('hcloud configure show');
  check('D2-4c', cfgShow.decision === 'deny', `hcloud configure show => ${cfgShow.decision}（凭证 inspect 被 redirect 到 redacted 工具）`);
}

// ==================== D1 升级检测（P0，Linux scope） ====================
section('D1-39 升级检测链可用性（Linux）');
{
  const tags = update.queryDistTagsSync({ timeoutMs: 20000 });
  check('D1-39a', tags && typeof tags.latest === 'string', `queryDistTagsSync => ${JSON.stringify(tags)}（Linux 无 .cmd/EINVAL 语义）`);
  const j = update.judgeUpdate('1.1.2', tags, undefined);
  check('D1-39b', j.result === 'update_available', `1.1.2 → judgeUpdate => ${j.result}（target=${j.targetVersion}）`);
}

section('D1-40 镜像 lag 检测正确性');
{
  // 镜像 lag：远端 <= 本地不提示版本倒退
  const lag = update.judgeUpdate('1.1.3', { latest: '1.1.2', next: null }, undefined);
  check('D1-40a', lag.result === 'up_to_date', `本地 1.1.3 / 镜像 latest 1.1.2 => ${lag.result}（不得提示倒退）`);
  const same = update.judgeUpdate('1.1.3', { latest: '1.1.3', next: '1.1.3-next.2' }, undefined);
  check('D1-40b', same.result === 'up_to_date', `本地 1.1.3 / 镜像 latest 1.1.3 => ${same.result}`);
  const real = update.queryDistTagsSync({ timeoutMs: 20000 });
  const jr = update.judgeUpdate('1.1.3', real, undefined);
  check('D1-40c', jr.result !== 'update_available' || semver_gt(jr.targetVersion, '1.1.3'), `真实镜像 dist-tags=${JSON.stringify(real)} → judgeUpdate('1.1.3') => ${jr.result} target=${jr.targetVersion}`);
}
function semver_gt(a, b) { return update.semverCompare(a, b) > 0; }

// ==================== D8-7 meta 技能 ====================
section('D8-7 7 个 meta/通用技能可机械执行');
{
  const tools = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
  const roots = [join(SRC, '..', 'skills'), join(SRC, '..', '..', '..', 'skills')];
  const root = tools.findSkillsRoot ? tools.findSkillsRoot(roots) : null;
  // 注意命名不一致：6 个用 huaweicloud- 前缀，getting-started 用 huawei- 前缀（轻微命名漂移，记录观察）
  const metaSkills = ['huaweicloud-core', 'huaweicloud-safety', 'huaweicloud-api-and-sdk', 'huaweicloud-capability-discovery', 'huaweicloud-cli-and-auth', 'huaweicloud-troubleshooting', 'huawei-getting-started'];
  let missing = [];
  const skillRoot = root || join(SRC, '..', 'skills');
  for (const s of metaSkills) {
    const skillFile = join(skillRoot, s, 'SKILL.md');
    if (!existsSync(skillFile)) { missing.push(s); continue; }
    const content = readFileSync(skillFile, 'utf8');
    if (!/^---\n/m.test(content) || content.trim().length < 100) missing.push(`${s}(内容异常)`);
  }
  check('D8-7', missing.length === 0, `7 个 meta 技能 SKILL.md 全部可加载（root=${skillRoot}）缺失=${JSON.stringify(missing)}`);
}

// ==================== 汇总 ====================
const pass = results.filter((r) => r.cond).length;
const fail = results.filter((r) => !r.cond).length;
console.log(`\n========== 汇总: ${results.length} 断言 / PASS ${pass} / FAIL ${fail} ==========`);
for (const r of results) if (!r.cond) console.log('FAIL 明细: ' + JSON.stringify(r));
process.exitCode = fail > 0 ? 2 : 0;
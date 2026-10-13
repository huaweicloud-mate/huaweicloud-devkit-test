// P0 + 关键安全/认证/协议 源码级探针 — Hermes / Linux / 1.1.4-next.3 (3b6290b)
// 直接 import 被测产品源码(safety-policy.mjs / risk-rule-engine.mjs / tools.mjs)，逐条断言。
// 用法: HDK_PLUGIN_SRC=<plugin-src-dir> node probe-security.mjs
import { readFileSync } from 'node:fs';

const HDK = process.env.HDK_PLUGIN_SRC;

const sp = await import(`file://${HDK}/src/safety-policy.mjs`);
const re = await import(`file://${HDK}/src/risk-rule-engine.mjs`);
const classifyTextCommand = sp.classifyTextCommand;
const classifyHcloudArgs = sp.classifyHcloudArgs;
const redactSecrets = sp.redactSecrets;

const RESULTS = [];
function record(id, title, expected, actual, pass, detail) {
  RESULTS.push({ id, title, expected, actual, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${title}`);
  console.log(`      expected: ${expected} | actual: ${actual}`);
  if (detail) console.log(`      detail: ${detail}`);
}
function decisionOf(fn) {
  try { return fn().decision; } catch (e) { return 'THROW:' + e.message; }
}

console.log('==============================================================');
console.log('P0 安全/认证 源码级探针  1.1.4-next.3 (3b6290b)');
console.log('==============================================================\n');

// ---------- D4-1 凭证文件读取拦截 ----------
{
  const cases = [
    ['cat ~/.hcloud/config.json', 'deny'],
    ['cat /root/.hcloud/credentials', 'deny'],
    ['type C:\\Users\\me\\.hcloud\\config.json', 'deny'],
    ['less ~/.hcloud/credentials', 'deny'],
    ['cat ~/.huaweicloud/config', 'deny'],
    ['cat hcloud/config.json', 'deny'],
    ['cat ~/notes.txt', 'allow'],
    ['ls ~/workspace', 'allow'],
  ];
  let allPass = true; const dets = [];
  for (const [cmd, exp] of cases) {
    const got = decisionOf(() => classifyTextCommand(cmd));
    if (got !== exp) allPass = false;
    dets.push(`${cmd} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<<'}`);
  }
  record('D4-1', '凭证文件读取拦截', '凭证路径 deny / 普通文件 allow', allPass ? '全部符合' : '存在漏判', allPass, dets.join('\n      '));
}

// ---------- D4-2 凭证 env 打印拦截 ----------
{
  const cases = [
    ['printenv HUAWEICLOUD_ACCESS_KEY', 'deny'],
    ['env | grep HUAWEICLOUD', 'deny'],
    ['printenv HW_ACCESS_KEY', 'deny'],
    ['echo $HW_ACCESS_KEY', 'deny'],
    ['echo $HW_SECRET_KEY', 'deny'],
    ['printenv HW_SECRET_KEY', 'deny'],
  ];
  const dets = []; let blocked = 0;
  for (const [cmd, exp] of cases) {
    const got = decisionOf(() => classifyTextCommand(cmd));
    if (got === exp) blocked++;
    dets.push(`${cmd} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<< 缺口'}`);
  }
  const pass = blocked === cases.length;
  record('D4-2', '凭证env打印拦截', '全部 env 泄露路径 deny', `${blocked}/${cases.length} deny`, pass, dets.join('\n      '));
}

// ---------- D4-3 明文 secret API 拦截 ----------
{
  const cases = [
    ['hcloud csms ShowSecretVersion --secret-name x', 'deny'],
    ['hcloud csms GetSecretValue --secret-name x', 'deny'],
    ['ShowSecretVersion secret-name=x', 'deny'],
    ['hcloud csms ShowSecret --secret-name x', 'allow'],
  ];
  const dets = []; let okAll = true;
  for (const [cmd, exp] of cases) {
    const got = decisionOf(() => classifyTextCommand(cmd));
    if (got !== exp) okAll = false;
    dets.push(`${cmd} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<<'}`);
  }
  record('D4-3', '明文secret API拦截', 'ShowSecretVersion/GetSecretValue deny; ShowSecret 元数据 allow', okAll ? '符合' : '不符合', okAll, dets.join('\n      '));
}

// ---------- D4-5 写操作误判检测 ----------
{
  const cases = [
    [['ecs', 'CreateServer'], 'deny'],
    [['ecs', 'DeleteServer'], 'deny'],
    [['ecs', 'ListServers'], 'allow'],
    [['ecs', 'BatchCreateServers'], 'deny'],
    [['ecs', 'GetServer'], 'allow'],
  ];
  const dets = []; let okAll = true;
  for (const [args, exp] of cases) {
    const got = classifyHcloudArgs(args, {}).decision;
    if (got !== exp) okAll = false;
    dets.push(`hcloud ${args.join(' ')} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<<'}`);
  }
  record('D4-5', '写操作误判检测', '写操作 deny / 读操作 allow 无误判', okAll ? '符合' : '存在误判', okAll, dets.join('\n      '));
}

// ---------- D4-9 公开暴露/破坏性预检 ----------
{
  const tests = [
    [[re.evaluateCommandRisk, 'hcloud ecs AuthorizeSecurityGroup --cidr 0.0.0.0/0 --port 22'], 'deny'],
    [[re.evaluateCommandRisk, 'hcloud ecs DeleteServer --force'], 'deny'],
  ];
  const dets = []; let okAll = true;
  for (const [[fn, cmd], exp] of tests) {
    const got = fn(cmd).decision;
    if (got !== exp) okAll = false;
    dets.push(`${cmd} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<<'}`);
  }
  record('D4-9', '公开暴露/破坏性预检', '公网管理端口/force 删除 deny', okAll ? '符合' : '不符合', okAll, dets.join('\n      '));
}

// ---------- D4-15 hook 绕过尝试 ----------
{
  const tests = [
    ['hcloud ecs DeleteServer', 'deny'],
    ['hcloud ecs DELETESERVER', 'deny'],
    ['hcloud ecs BatchDeleteServers', 'deny'],
    ['hcloud ecs DeleteServer --force', 'deny'],
    ['hcloud ecs Delete%53erver', 'deny'],
  ];
  const dets = []; let blocked = 0;
  for (const [cmd, exp] of tests) {
    const got = decisionOf(() => classifyTextCommand(cmd));
    if (got === exp) blocked++;
    dets.push(`${cmd} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<<'}`);
  }
  record('D4-15', 'hook绕过尝试', '大小写/复数/force/URL编码变体全部拦截', `${blocked}/${tests.length} 拦截`, blocked === tests.length, dets.join('\n      '));
}

// ---------- D4-16 命令包裹穿透 ----------
{
  const tests = [
    ['sh -c "hcloud ecs DeleteServer"', 'deny'],
    ["bash -c 'hcloud ecs DeleteServer'", 'deny'],
    ['eval "hcloud ecs DeleteServer"', 'deny'],
    ['$(hcloud ecs DeleteServer)', 'deny'],
  ];
  const dets = []; let blocked = 0;
  for (const [cmd, exp] of tests) {
    const got = decisionOf(() => classifyTextCommand(cmd));
    if (got === exp) blocked++;
    dets.push(`${cmd} -> ${got} (exp ${exp}) ${got === exp ? '' : '<<<'}`);
  }
  record('D4-16', '命令包裹穿透', 'sh/bash/eval/$() 包裹均检测内层写操作', `${blocked}/${tests.length} 拦截`, blocked === tests.length, dets.join('\n      '));
}

// ---------- D4-18 confirm-not-deny 审批语义 ----------
{
  const r = classifyHcloudArgs(['ecs', 'CreateServer'], {});
  const ok = r.decision === 'deny' && r.risk === 'write' && /plan|approval/i.test(r.reason || '');
  record('D4-18', 'confirm-not-deny审批语义', '写操作 deny+risk=write+提供审批路径', `decision=${r.decision} risk=${r.risk}`, ok, `reason=${r.reason}`);
}

// ---------- D4-19 确认流下预检仍生效 ----------
{
  const r1 = classifyHcloudArgs(['ecs', 'CreateServer'], { allowWrites: true });
  const ok1 = r1.decision === 'allow';
  const r2 = re.evaluateCommandRisk('hcloud ecs AuthorizeSecurityGroup --cidr 0.0.0.0/0 --port 22').decision;
  const ok2 = r2 === 'deny';
  record('D4-19', '确认流下预检仍生效', 'allowWrites 放行普通写; 危险规则仍 deny', `approve写=${r1.decision} 危险规则=${r2}`, ok1 && ok2, '');
}

// ---------- D4-21 hook_check_artifacts IAM 管理员 ----------
{
  const policy = '{"Statement":[{"Effect":"Allow","Action":"*:*","Resource":"*"}]}';
  const r = re.evaluateArtifacts([{ path: 'policy.json', content: policy }]);
  const ok = r.decision === 'deny' && r.findings.some(f => f.ruleId === 'hwc-iam-admin-policy');
  record('D4-21', 'hook_check_artifacts IAM宽泛策略', '宽泛 IAM 策略 deny', `decision=${r.decision}`, ok, JSON.stringify(r.findings.map(f=>f.ruleId)));
}

// ---------- D4-22 hook_check_deploy_plan FunctionGraph 公网 ----------
{
  const plan = 'Create FunctionGraph trigger with security_authentication=NONE, 0.0.0.0/0';
  const r = re.evaluateDeployPlan(plan);
  const ok = r.decision !== 'allow' && r.findings.some(f => f.ruleId === 'hwc-functiongraph-public-no-auth');
  record('D4-22', 'hook_check_deploy_plan FunctionGraph公网无认证', 'warn/deny 公网无认证部署', `decision=${r.decision}`, ok, JSON.stringify(r.findings.map(f=>f.ruleId)));
}

// ---------- D2-4 凭证脱敏正确性 ----------
{
  const obj = { accessKeyId: 'AK123secret', secretAccessKey: 'sk_abcdef', securityToken: 'tok123', region: 'cn-north-4', projectId: 'p1' };
  const out = redactSecrets(obj);
  const ok = out.accessKeyId === '<redacted>' && out.secretAccessKey === '<redacted>' && out.securityToken === '<redacted>' && out.region === 'cn-north-4' && out.projectId === 'p1';
  record('D2-4', '凭证脱敏正确性', 'AK/SK/token 脱敏, region/projectId 保留', ok ? '符合' : '不符合', ok, JSON.stringify(out));
}

// ---------- D2-11 R3 STS token 拒绝落盘 ----------
{
  const srcText = readFileSync(`${HDK}/src/tools.mjs`, 'utf8');
  const hasStsGuard = /Temporary STS credentials cannot be persisted/.test(srcText);
  record('D2-11', 'R3 STS token拒绝落盘', 'persist 路径检测并拒绝 securityToken', hasStsGuard ? '源码含拒绝逻辑' : '未找到', hasStsGuard, 'grep tools.mjs "cannot be persisted"');
}

// ---------- D1-40 镜像 lag 检测正确性 ----------
{
  const srcText = readFileSync(`${HDK}/src/update-check.mjs`, 'utf8');
  const hasJudge = /judgeUpdate|update_available|up_to_date/.test(srcText);
  record('D1-40', '镜像lag下检测正确性', 'judgeUpdate 语义存在', hasJudge ? '源码含检测语义' : '未找到', hasJudge, 'grep update-check.mjs');
}

// ---------- D10-1 工具描述可选择性 ----------
{
  const tools = (await import(`file://${HDK}/src/tools.mjs`)).TOOL_DEFINITIONS;
  const total = tools.length;
  const withDesc = tools.filter(t => t.description && t.description.length > 10).length;
  const withSchema = tools.filter(t => t.inputSchema || t.parameters).length;
  const names = tools.map(t => t.name);
  const ok = total > 0 && withDesc === total && withSchema === total;
  record('D10-1', '工具描述可选择性', `${total} 工具全含 description+inputSchema`, `desc=${withDesc}/${total} schema=${withSchema}/${total}`, ok, `总工具数=${total}`);
  console.log('\n[工具名全集] (' + total + ') ' + names.join(', '));
}

// 汇总
console.log('\n==============================================================');
const passN = RESULTS.filter(r => r.pass).length;
console.log(`总计 ${RESULTS.length} 条, PASS ${passN}, FAIL ${RESULTS.length - passN}`);
console.log('JSON_RESULTS=' + JSON.stringify(RESULTS, null, 2));
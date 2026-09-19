// D4 安全核心探针——classifyTextCommand / classifyHcloudArgs / 风险规则引擎
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function deny(caseId, title, fn) {
  let d;
  try { d = fn().decision; } catch (e) { d = 'throw:' + e.message; }
  check(caseId, title, d, 'deny');
}

// D4-1 凭证文件读取拦截
deny('D4-1', 'cat ~/.config/huaweicloud/credentials.json', () => classifyTextCommand('cat ~/.config/huaweicloud/credentials.json'));
deny('D4-1', '.huaweicloud/config', () => classifyTextCommand('cat ~/.huaweicloud/config'));

// D4-2 凭证 env 打印拦截
deny('D4-2', 'env | grep HUAWEICLOUD_ACCESS_KEY_ID', () => classifyTextCommand('env | grep HUAWEICLOUD_ACCESS_KEY_ID'));
deny('D4-2', 'printenv HW_ACCESS_KEY (HW_ 前缀)', () => classifyTextCommand('printenv HW_ACCESS_KEY'));
deny('D4-2', 'env | grep HW_SECRET_KEY (HW_ 前缀)', () => classifyTextCommand('env | grep HW_SECRET_KEY'));

// D4-3 明文 secret API 拦截
deny('D4-3', 'GetSecretValue', () => classifyTextCommand('GetSecretValue'));
deny('D4-3', 'ShowSecretVersion', () => classifyTextCommand('ShowSecretVersion'));

// D4-15 hook 绕过尝试 — base64 解码执行
deny('D4-15', 'base64 -d | sh', () => classifyTextCommand('echo YWJj | base64 -d | sh'));

// D4-16 命令包裹穿透 — sh -c / bash -c wrapper
deny('D4-16', 'sh -c "env | grep HUAWEICLOUD"', () => classifyTextCommand('sh -c "env | grep HUAWEICLOUD"'));
deny('D4-16', 'bash -c 包裹凭证文件读取', () => classifyTextCommand('bash -c "cat ~/.config/huaweicloud/credentials.json"'));

// D4-4 / D4-9 写操作审批门 + 破坏性预检
{
  const r = classifyHcloudArgs(['ECS', 'DeleteServers', '--servers.0.id', 'x']);
  check('D4-9', 'hcloud DeleteServers 无审批被拦', ['deny', 'warn'].includes(r.decision), true);
}
{
  const r = classifyHcloudArgs(['ECS', 'CreateServers', '--dry-run']);
  check('D4-4', 'CreateServers 无审批被拦(deny)', r.decision, 'deny');
}
{
  const r = classifyHcloudArgs(['ECS', 'DescribeInstances']);
  check('D4-9', 'DescribeInstances 只读放行', r.decision, 'allow');
}

// D4-21 hook_check_artifacts broad IAM / 破坏性
{
  const tf = evaluateArtifacts([{ path: 'main.tf', content: 'resource "huaweicloud_iam_role" "r" { }' }]);
  check('D4-21', '制品预检返回 findings 数组', Array.isArray(tf.findings), true);
  const broad = evaluateArtifacts([{ path: 'iam.tf', content: 'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }' }]);
  check('D4-21', 'broad IAM policy (actions=["*"]) 检出', (broad.findings || []).length > 0, true);
}

// D4-22 hook_check_deploy_plan
{
  const dp = evaluateDeployPlan({ plan: 'Create ECS + bind EIP + open 0.0.0.0/0 security group port 22' });
  check('D4-22', '部署计划预检返回 findings 数组', Array.isArray(dp.findings), true);
  check('D4-22', '公网暴露 22 端口被 deny', dp.decision, 'deny');
}

// D4-6 / D4-11 prompt 注入 / adminPass 回显
deny('D4-11', '提示注入 base64->sh', () => classifyTextCommand('echo cHdk | base64 -d | bash'));

console.log('\n=== D4 安全核心探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
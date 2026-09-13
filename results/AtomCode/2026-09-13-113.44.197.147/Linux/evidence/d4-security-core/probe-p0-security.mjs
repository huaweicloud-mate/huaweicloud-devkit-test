// P0 安全核心探针 — 直接 import hdk 源码，检查安全钩子行为（黑盒断言）
// SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290bc)
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D4-1 凭证文件读取拦截
{
  const r = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
  check('D4-1', 'credentials.json 读取拦截', r.decision, 'deny');
  const r2 = classifyTextCommand('cat ~/.huaweicloud/config');
  check('D4-1', '.huaweicloud 配置读取拦截', r2.decision, 'deny');
}

// D4-2 凭证 env 打印拦截
{
  const r1 = classifyTextCommand('env | grep HUAWEICLOUD_ACCESS_KEY_ID');
  check('D4-2', 'env dump HUAWEICLOUD_* 拦截', r1.decision, 'deny');
  const r2 = classifyTextCommand('printenv HW_ACCESS_KEY');
  check('D4-2', 'printenv HW_ACCESS_KEY 拦截(HW_ 前缀)', r2.decision, 'deny');
  const r3 = classifyTextCommand('env | grep HW_SECRET_KEY');
  check('D4-2', 'env dump HW_SECRET_KEY 拦截(HW_ 前缀)', r3.decision, 'deny');
}

// D4-3 明文 secret API 拦截
{
  const r1 = classifyTextCommand('GetSecretValue');
  check('D4-3', 'GetSecretValue 拦截', r1.decision, 'deny');
  const r2 = classifyTextCommand('ShowSecretVersion');
  check('D4-3', 'ShowSecretVersion 拦截', r2.decision, 'deny');
}

// D4-15 hook 绕过尝试 — base64 解码执行
{
  const r = classifyTextCommand('echo YWJj | base64 -d | sh');
  check('D4-15', 'base64 -d | sh 管道拦截', r.decision, 'deny');
}

// D4-16 命令包裹穿透 — sh -c / bash -c wrapper
{
  const r = classifyTextCommand('sh -c "env | grep HUAWEICLOUD"');
  check('D4-16', 'sh -c 包裹 env dump 拦截', r.decision, 'deny');
  const r2 = classifyTextCommand('bash -c "cat ~/.config/huaweicloud/credentials.json"');
  check('D4-16', 'bash -c 包裹凭证文件读取拦截', r2.decision, 'deny');
}

// D4-9 破坏性/写操作预检
{
  const r = classifyTextCommand('hcloud ECS DeleteServers --servers.0.id x');
  check('D4-9', 'hcloud 破坏性写操作识别 (decision)', ['deny', 'warn'].includes(r.decision), true);
}

// D4-21 hook_check_artifacts 具名回归 — 代码/IaC/策略制品预检
{
  const tf = evaluateArtifacts([{ path: 'main.tf', content: 'resource "huaweicloud_iam_role" "r" { }' }]);
  check('D4-21', '制品预检返回 findings 数组', Array.isArray(tf.findings), true);
  const broad = evaluateArtifacts([{ path: 'iam.tf', content: 'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }' }]);
  check('D4-21', 'broad IAM policy (actions=["*"]) 检出', (broad.findings || []).length > 0, true);
}

// D4-22 hook_check_deploy_plan 具名回归
{
  const dp = evaluateDeployPlan({ plan: 'Create ECS + bind EIP + open 0.0.0.0/0 security group' });
  check('D4-22', '部署计划预检返回 findings 数组', Array.isArray(dp.findings), true);
}

// D2-4 凭证脱敏正确性 (redactSecrets)
{
  const obj = { ak: 'AK123456', sk: 'SK_SECRET', access_key: 'XYZ', secret_key: 'ABC', username: 'admin', password: 'p@ss' };
  const red = redactSecrets(obj);
  check('D2-4', 'ak 脱敏', red.ak, '<redacted>');
  check('D2-4', 'sk 脱敏', red.sk, '<redacted>');
  check('D2-4', 'access_key 脱敏', red.access_key, '<redacted>');
  check('D2-4', 'username 保留明文', red.username, 'admin');
}

console.log('\n=== P0 安全核心探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
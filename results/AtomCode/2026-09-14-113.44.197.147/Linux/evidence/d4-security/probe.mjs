// P0/P1 安全核心探针：直调 safety-policy + risk-rule-engine 导出函数
import {
  classifyTextCommand,
  classifyHcloudArgs,
  redactSecrets,
  assertAllowed,
} from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import {
  evaluateArtifacts,
  evaluateDeployPlan,
  evaluateCommandRisk,
} from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

let pass = 0, fail = 0;
function eq(id, desc, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}
function bool(id, desc, actual) {
  const ok = actual === true;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${actual} (expected true)`);
}
const D = (c) => classifyTextCommand(c).decision;

// D4-1 凭证文件读取拦截
eq('D4-1', 'classifyTextCommand "cat ~/.hcloud/config"', D('cat ~/.hcloud/config'), 'deny');
eq('D4-1', 'classifyTextCommand "cat ~/.huaweicloud/credentials"', D('cat ~/.huaweicloud/credentials'), 'deny');
// D4-2 凭证 env 打印拦截
eq('D4-2', 'env dump HUAWEICLOUD_ACCESS_KEY', D('env | grep HUAWEICLOUD_ACCESS_KEY'), 'deny');
eq('D4-2', 'printenv HW_ACCESS_KEY (HW_ 前缀)', D('printenv HW_ACCESS_KEY'), 'deny');
eq('D4-2', 'env dump HW_SECRET_KEY (HW_ 前缀)', D('env | grep HW_SECRET_KEY'), 'deny');
// D4-3 明文 secret API 拦截
eq('D4-3', 'hcloud csms ShowSecretVersion', D('hcloud csms ShowSecretVersion --secret-name x'), 'deny');
eq('D4-3', 'hcloud csms GetSecretValue', D('hcloud csms GetSecretValue --secret-name x'), 'deny');
// D4-4 写操作审批门 (allowWrites=false)
eq('D4-4', 'hcloud ecs CreateServers (未审批)', classifyHcloudArgs(['ecs', 'CreateServers', '--count', '1'], { allowWrites: false }).decision, 'deny');
eq('D4-4', 'hcloud ecs CreateServers (已审批)', classifyHcloudArgs(['ecs', 'CreateServers', '--count', '1'], { allowWrites: true }).decision, 'allow');
// D4-5 写操作不被误判为只读
eq('D4-5', 'hcloud ecs ListServersDetails (只读)', classifyHcloudArgs(['ecs', 'ListServersDetails'], { allowWrites: false }).decision, 'allow');
eq('D4-5', 'hcloud ecs DeleteServers (写,未审批)', classifyHcloudArgs(['ecs', 'DeleteServers'], { allowWrites: false }).decision, 'deny');
// D4-9 公开暴露/破坏性预检
eq('D4-9', '公网 0.0.0.0/0 开放 22 端口', evaluateCommandRisk('hcloud ecs AuthorizeSecurityGroupIngress --cidr 0.0.0.0/0 --port 22').decision, 'deny');
eq('D4-9', '强制删除 + --force', evaluateCommandRisk('hcloud ecs DeleteServers --force').decision, 'deny');
// D4-15 hook 绕过尝试 (编码 shell 执行)
eq('D4-15', 'base64 -d | sh 编码执行', D('echo ZWNobyBoYWNrZWQ= | base64 -d | sh'), 'deny');
// D4-16 命令包裹穿透
eq('D4-16', 'sh -c 包裹 env dump', D('sh -c "env | grep HUAWEICLOUD_ACCESS_KEY"'), 'deny');
eq('D4-16', 'bash -c 包裹凭证文件读取', D('bash -c "cat ~/.hcloud/config"'), 'deny');
// D4-20 拒绝后零操作：assertAllowed 对 deny 抛错
{
  let threw = false;
  try { assertAllowed({ decision: 'deny', reason: 'blocked' }); } catch { threw = true; }
  bool('D4-20', 'assertAllowed(deny) 抛错拦截', threw);
}
// D4-21 hook_check_artifacts 具名回归
{
  const r = evaluateArtifacts([
    { path: 'iam-policy.json', content: '{"Action":"*","Effect":"Allow"}' },
    { path: 'safe.tf', content: 'resource "huaweicloud_vpc" "main" { cidr = "10.0.0.0/16" }' },
  ]);
  bool('D4-21', '制品预检返回 findings 数组', Array.isArray(r.findings));
  eq('D4-21', 'broad IAM (Action=*) 检出 deny', r.decision, 'deny');
}
// D4-22 hook_check_deploy_plan 具名回归
{
  const r = evaluateDeployPlan('FunctionGraph trigger public no auth: cidr 0.0.0.0/0 port 22');
  bool('D4-22', '部署计划预检返回 findings', Array.isArray(r.findings) && r.findings.length >= 0);
  const denyOrWarn = r.decision === 'deny' || r.decision === 'warn';
  bool('D4-22', '公网暴露 FunctionGraph 被拦截/告警', denyOrWarn);
}
// D2-4 凭证脱敏
eq('D2-4', 'ak 脱敏', redactSecrets({ ak: 'ABCD1234' }).ak, '<redacted>');
eq('D2-4', 'sk 脱敏', redactSecrets({ sk: 'secretxyz' }).sk, '<redacted>');
eq('D2-4', 'access_key 脱敏', redactSecrets({ access_key: 'AK' }).access_key, '<redacted>');
eq('D2-4', 'adminPass 字符串脱敏', redactString('adminPass=abc123'), 'adminPass=<redacted>');

function redactString(t) { return redactSecrets(t); }

console.log(`TOTAL pass=${pass} fail=${fail}`);
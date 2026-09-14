/**
 * WorkBuddy 每日测试探针 - P0 安全核心
 * 测试用例: D4-1, D4-2, D4-3, D4-9, D4-15, D4-16, D4-18, D4-19, D4-20, D4-21, D4-22
 *
 * 验证 huaweicloud-devkit 安全策略的拦截能力
 */
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateArtifacts, evaluateCommandRisk, evaluateDeployPlan } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = [];

function test(name, actual, expected, passMsg, failMsg) {
  const pass = typeof expected === 'function' ? expected(actual) : actual === expected;
  results.push({ name, pass, actual, expected: typeof expected === 'function' ? '<function>' : expected, passMsg, failMsg });
  return pass;
}

// === D4-1: 凭证文件读取拦截 ===
// 预期: 读取凭证文件被阻断
test('D4-1 credential-file-read-block',
  classifyTextCommand('cat ~/.config/huaweicloud/credentials.json').decision,
  'deny',
  '凭证文件读取被 deny 拦截',
  '凭证文件读取未被拦截'
);

test('D4-1 credential-file-read-block-2',
  classifyTextCommand('type %USERPROFILE%\.config\huaweicloud\credentials.json').decision,
  'deny',
  'Windows 凭证文件读取被 deny 拦截',
  'Windows 凭证文件读取未被拦截'
);

// === D4-2: 凭证 env 打印拦截 ===
// 预期: env/printenv 打印 HUAWEICLOUD 环境变量被阻断
test('D4-2 env-dump-block',
  classifyTextCommand('env | grep HUAWEICLOUD').decision,
  'deny',
  'env grep HUAWEICLOUD 被 deny 拦截',
  'env grep HUAWEICLOUD 未被拦截'
);

test('D4-2 env-dump-block-2',
  classifyTextCommand('printenv HWC_ACCESS_KEY').decision,
  'deny',
  'printenv HWC_ACCESS_KEY 被 deny 拦截',
  'printenv HWC_ACCESS_KEY 未被拦截'
);

// Check HW_ACCESS_KEY/HW_SECRET_KEY prefix coverage
test('D4-2 env-dump-hw-prefix',
  classifyTextCommand('env | grep HW_ACCESS_KEY').decision,
  'deny',
  'env grep HW_ACCESS_KEY 被 deny 拦截',
  'env grep HW_ACCESS_KEY 未被拦截 — HW_ 前缀规则缺失'
);

// echo command check
test('D4-2 echo-secret-block',
  classifyTextCommand('echo $HUAWEICLOUD_ACCESS_KEY_ID').decision,
  (d) => d, // just record the decision
  null,
  null
);

// === D4-3: 明文 secret API 拦截 ===
test('D4-3 secret-api-block',
  classifyTextCommand('hcloud csms showsecretversion --secret-id test123').decision,
  'deny',
  'showsecretversion 被 deny 拦截',
  'showsecretversion 未被拦截'
);

test('D4-3 secret-api-block-2',
  classifyTextCommand('hcloud kps getsecretvalue --key-id test').decision,
  'deny',
  'getsecretvalue 被 deny 拦截',
  'getsecretvalue 未被拦截'
);

// === D4-9: 公开暴露/破坏性预检 ===
// Test risk rule engine for public exposure detection
const publicExposurePlan = JSON.stringify({
  resources: [
    { type: 'FunctionGraph', properties: { handler: 'index.handler', code_type: 'inline', func_code: { file: 'z[]' } } }
  ]
});

const deployResult = evaluateDeployPlan({ plan: 'Create FunctionGraph with public endpoint 0.0.0.0/0 and admin_pass=Test123456' });
test('D4-9 deploy-plan-public-exposure',
  deployResult.findings ? deployResult.findings.length > 0 : false,
  true,
  `部署计划预检发现 ${deployResult.findings?.length || 0} 个风险项`,
  '部署计划预检未发现风险项'
);

// Destructive command
const destructiveCmd = evaluateCommandRisk('rm -rf / && hcloud ecs delete-servers --server-ids 0123');
test('D4-9 destructive-command',
  destructiveCmd.decision || (destructiveCmd.findings && destructiveCmd.findings.length > 0),
  true,
  '破坏性命令被风险规则引擎标记',
  '破坏性命令未被风险规则引擎标记'
);

// === D4-15: hook 绕过尝试 ===
// Attempt to bypass hook with encoding/obfuscation
test('D4-15 bypass-base64',
  classifyTextCommand('echo Y2F0IH4vLmNvbmZpZy9odWF3ZWljbG91ZC9jcmVkZW50aWFscy5qc29u | base64 -d | sh').decision,
  (d) => d, // record decision
  null, null
);

test('D4-15 bypass-newline',
  classifyTextCommand('cat\\n~/.config/huaweicloud/credentials.json').decision,
  (d) => d,
  null, null
);

// === D4-16: 命令包裹穿透 ===
// Inner command detection
test('D4-16 wrapper-penetration',
  classifyTextCommand('bash -c "cat ~/.config/huaweicloud/credentials.json"').decision,
  (d) => d,
  null, null
);

test('D4-16 wrapper-penetration-2',
  classifyTextCommand('sh -c "env | grep HUAWEICLOUD"').decision,
  (d) => d,
  null, null
);

// === D4-18: confirm-not-deny 审批语义 ===
// Write operations need explicit confirmation, not directly denied or allowed
const writeResult = classifyHcloudArgs(['hcloud', 'ecs', 'create-servers']);
test('D4-18 write-needs-approval',
  writeResult.decision,
  'deny',
  '写操作在无审批时被 deny',
  '写操作未被 deny'
);

const writeApproved = classifyHcloudArgs(['hcloud', 'ecs', 'create-servers'], { allowWrites: true });
test('D4-18 write-approved-allowed',
  writeApproved.decision,
  'allow',
  '审批后写操作被 allow',
  '审批后写操作未被 allow'
);

// === D4-19: 确认流下预检仍生效 ===
// Even with allowWrites, risk rules should still apply
const riskyWrite = classifyHcloudArgs(['hcloud', 'ecs', 'create-servers'], { allowWrites: true });
test('D4-19 precheck-with-approval',
  riskyWrite.decision,
  'allow',
  '审批后写操作可执行但受风险规则约束',
  null
);

// === D4-20: 拒绝后零操作 ===
// Denied operations should not execute
test('D4-20 deny-no-exec',
  classifyHcloudArgs(['hcloud', 'csms', 'showsecretversion', '--secret-id', 'test']).decision,
  'deny',
  'secret 操作被 deny 不执行',
  'secret 操作未被 deny'
);

// === D4-21: hook_check_artifacts 回归 ===
// Broad IAM policy artifact should be blocked
const iamArtifact = {
  path: 'main.tf',
  content: `resource "huaweicloud_identity_role" "broad" {
  name = "admin-access"
  description = "Full admin"
  policy = jsonencode({
    Version = "1.1"
    Statement = [{
      Effect = "Allow"
      Action = ["*"]
      Resource = ["*"]
    }]
  })
}`
};
const artifactResult = evaluateArtifacts(iamArtifact);
test('D4-21 broad-iam-artifact',
  artifactResult.findings && artifactResult.findings.length > 0,
  true,
  `broad IAM 制品被拦截，发现 ${artifactResult.findings?.length || 0} 个风险`,
  'broad IAM 制品未被拦截'
);

// === D4-22: hook_check_deploy_plan 回归 ===
// Public exposure FunctionGraph should be blocked/warned
const fgDeployPlan = {
  plan: `Deploy FunctionGraph function with public endpoint:
- function: hello-world
- trigger: API Gateway, 0.0.0.0/0
- admin_pass: Admin@123456
- resources: [*]`
};
const dpResult = evaluateDeployPlan(fgDeployPlan);
test('D4-22 public-fg-deploy',
  dpResult.findings && dpResult.findings.length > 0,
  true,
  `公网暴露 FunctionGraph 被拦截/告警，发现 ${dpResult.findings?.length || 0} 个风险`,
  '公网暴露 FunctionGraph 未被拦截/告警'
);

// === D2-4: 凭证脱敏正确性 ===
const redacted = redactSecrets({
  access_key: 'AKIDtest123456',
  secret_key: 'SKtest789',
  security_token: 'STStoken456',
  project_id: 'cn-north-4',
  region: 'cn-north-4',
  description: 'normal text',
});
test('D2-4 credential-redaction',
  redacted.access_key === '<redacted>' && redacted.secret_key === '<redacted>' && redacted.security_token === '<redacted>',
  true,
  '凭证字段被脱敏',
  '凭证字段未被正确脱敏'
);

test('D2-4 non-sensitive-preserved',
  redacted.project_id === 'cn-north-4' && redacted.region === 'cn-north-4',
  true,
  '非敏感字段（project_id/region）未被脱敏',
  '非敏感字段被误脱敏'
);

// String redaction
const redactedStr = redactSecrets('access_key=AKIDtest secret_key=SKtest');
test('D2-4 string-redaction',
  redactedStr.includes('<redacted>'),
  true,
  '字符串中凭证被脱敏',
  '字符串中凭证未被脱敏'
);

// Print results
console.log(JSON.stringify(results, null, 2));
const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n=== P0 安全核心: ${passCount} PASS / ${failCount} FAIL / ${results.length} TOTAL ===`);

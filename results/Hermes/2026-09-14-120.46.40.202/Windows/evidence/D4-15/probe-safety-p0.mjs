// Comprehensive safety probe for P0 security test cases
import { classifyHcloudArgs, redactSecrets } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';

let passCount = 0, failCount = 0, results = [];

function record(id, status, detail) {
  results.push({ id, status, detail });
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
  console.log(`[${id}] ${status}: ${detail}`);
}

// ===== D4-1: 凭证文件读取拦截 =====
console.log('\n=== D4-1: 凭证文件读取拦截 ===');
// Test cat/type of credential files
const catCredResult = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
record('D4-1', catCredResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `cat ~/.hcloud/credentials.json => decision: ${catCredResult.decision}, findings: ${catCredResult.findings?.length || 0}`);

const typeCredResult = evaluateCommandRisk('type C:\\Users\\.huaweicloud\\credentials.yaml');
record('D4-1', typeCredResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `type .huaweicloud => decision: ${typeCredResult.decision}`);

// Also test through classifyHcloudArgs
const hcloudShowResult = classifyHcloudArgs(['hcloud', 'configure', 'show']);
record('D4-1', hcloudShowResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `hcloud configure show => decision: ${hcloudShowResult.decision}, reason: ${hcloudShowResult.reason}`);

// ===== D4-2: 凭证env打印拦截 =====
console.log('\n=== D4-2: 凭证env打印拦截 ===');
const printenvResult = evaluateCommandRisk('printenv | grep -E "AK|SK|ACCESS_KEY|SECRET_KEY"');
record('D4-2', printenvResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `printenv AK/SK => decision: ${printenvResult.decision}, findings: ${printenvResult.findings?.length || 0}`);

const echoResult = evaluateCommandRisk('echo $HCLOUD_ACCESS_KEY');
record('D4-2', echoResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `echo $HCLOUD_ACCESS_KEY => decision: ${echoResult.decision}`);

// ===== D4-3: 明文secret API拦截 =====
console.log('\n=== D4-3: 明文secret API拦截 ===');
const secretResult = classifyHcloudArgs(['hcloud', 'KMS', 'ShowSecretVersion', '--secret_id=test']);
record('D4-3', secretResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `ShowSecretVersion => decision: ${secretResult.decision}, risk: ${secretResult.risk}`);

const secretResult2 = classifyHcloudArgs(['hcloud', 'DEW', 'GetSecretValue', '--secret_id=test']);
record('D4-3', secretResult2.decision === 'deny' ? 'PASS' : 'FAIL',
  `GetSecretValue => decision: ${secretResult2.decision}, risk: ${secretResult2.risk}`);

// Test regex-based secret detection
const secretStringResult = evaluateCommandRisk('hcloud KMS show-secret-string --secret_id=test');
record('D4-3', secretStringResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `show-secret-string => decision: ${secretStringResult.decision}`);

// ===== D4-5: 写操作误判检测 =====
console.log('\n=== D4-5: 写操作误判检测 ===');
const deleteResult = classifyHcloudArgs(['hcloud', 'ECS', 'DeleteServer', '--server_id=test']);
record('D4-5', deleteResult.decision !== 'allow' || deleteResult.risk !== 'read_only' ? 'PASS' : 'FAIL',
  `DeleteServer => decision: ${deleteResult.decision}, risk: ${deleteResult.risk}`);

const createResult = classifyHcloudArgs(['hcloud', 'ECS', 'CreateServer', '--name=test']);
record('D4-5', createResult.decision !== 'allow' || createResult.risk !== 'read_only' ? 'PASS' : 'FAIL',
  `CreateServer => decision: ${createResult.decision}, risk: ${createResult.risk}`);

const updateResult = classifyHcloudArgs(['hcloud', 'VPC', 'UpdateSecurityGroup', '--security_group_id=test']);
record('D4-5', updateResult.decision !== 'allow' || updateResult.risk !== 'read_only' ? 'PASS' : 'FAIL',
  `UpdateSecurityGroup => decision: ${updateResult.decision}, risk: ${updateResult.risk}`);

// ===== D4-9: 公开暴露/破坏性预检 =====
console.log('\n=== D4-9: 公开暴露/破坏性预检 ===');
// Public exposure
const publicSgResult = evaluateCommandRisk('hcloud VPC CreateSecurityGroupRule --direction=ingress --port_range_min=22 --protocol=tcp --remote_ip_prefix=0.0.0.0/0');
record('D4-9', publicSgResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `Public SSH SG rule => decision: ${publicSgResult.decision}, findings: ${publicSgResult.findings?.length || 0}`);

// Destructive operation
const forceDeleteResult = evaluateCommandRisk('hcloud ECS DeleteServer --server_id=test --force=true');
record('D4-9', forceDeleteResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `Force delete => decision: ${forceDeleteResult.decision}, findings: ${forceDeleteResult.findings?.length || 0}`);

// ===== D4-15: hook绕过尝试 =====
console.log('\n=== D4-15: hook绕过尝试 ===');
// Case variations
const caseResult = classifyHcloudArgs(['hcloud', 'ECS', 'DeleteServer', '--server_id=test']);
const caseResult2 = classifyHcloudArgs(['hcloud', 'ecs', 'deleteServer', '--server_id=test']);
const caseResult3 = classifyHcloudArgs(['hcloud', 'ECS', 'DELETEserver', '--server_id=test']);
record('D4-15',
  (caseResult.decision !== 'allow' || caseResult.risk !== 'read_only') &&
  (caseResult2.decision !== 'allow' || caseResult2.risk !== 'read_only') &&
  (caseResult3.decision !== 'allow' || caseResult3.risk !== 'read_only') ? 'PASS' : 'FAIL',
  `Case variants: DeleteServer=${caseResult.decision}, deleteServer=${caseResult2.decision}, DELETEserver=${caseResult3.decision}`);

// URL encoding / escape confusion
const encodedResult = evaluateCommandRisk('hcloud ECS %44eleteServer --server_id=test');
record('D4-15', encodedResult.decision !== 'allow' || encodedResult.findings?.length > 0 ? 'PASS' : 'CHECK',
  `URL encoded: decision=${encodedResult.decision}, findings=${encodedResult.findings?.length || 0}`);

// ===== D4-16: 命令包裹穿透 =====
console.log('\n=== D4-16: 命令包裹穿透 ===');
const wrapResult1 = evaluateCommandRisk('sh -c "hcloud ECS DeleteServer --server_id=test"');
record('D4-16', wrapResult1.decision !== 'allow' ? 'PASS' : 'CHECK',
  `sh -c wrap: decision=${wrapResult1.decision}, findings=${wrapResult1.findings?.length || 0}`);

const wrapResult2 = evaluateCommandRisk('bash -c "hcloud ECS DeleteServer --server_id=test"');
record('D4-16', wrapResult2.decision !== 'allow' ? 'PASS' : 'CHECK',
  `bash -c wrap: decision=${wrapResult2.decision}, findings=${wrapResult2.findings?.length || 0}`);

const wrapResult3 = evaluateCommandRisk('eval "hcloud ECS DeleteServer --server_id=test"');
record('D4-16', wrapResult3.decision !== 'allow' ? 'PASS' : 'CHECK',
  `eval wrap: decision=${wrapResult3.decision}, findings=${wrapResult3.findings?.length || 0}`);

// ===== D4-21: hook_check_artifacts (broad IAM policy) =====
console.log('\n=== D4-21: hook_check_artifacts (broad IAM policy) ===');
const broadIamPolicy = {
  path: 'policy.json',
  content: JSON.stringify({
    "Statement": [{
      "Effect": "Allow",
      "Action": ["*"],
      "Resource": ["*"]
    }]
  })
};
const artifactResult = evaluateArtifacts([broadIamPolicy]);
record('D4-21', artifactResult.decision === 'deny' ? 'PASS' : 'FAIL',
  `Broad IAM policy artifact => decision: ${artifactResult.decision}, findings: ${artifactResult.findings?.length || 0}`);
if (artifactResult.findings?.length > 0) {
  console.log(`  Finding: ${artifactResult.findings[0].ruleId} - ${artifactResult.findings[0].message}`);
}

// ===== D4-22: hook_check_deploy_plan (public exposure) =====
console.log('\n=== D4-22: hook_check_deploy_plan (public exposure) ===');
const deployPlan = JSON.stringify({
  "service": "FunctionGraph",
  "trigger": {
    "type": "APIG",
    "auth": "NONE",
    "public": true
  },
  "port": 8080
});
const deployResult = evaluateDeployPlan(deployPlan);
record('D4-22', deployResult.decision === 'deny' || deployResult.decision === 'warn' ? 'PASS' : 'FAIL',
  `Public FunctionGraph deploy plan => decision: ${deployResult.decision}, findings: ${deployResult.findings?.length || 0}`);
if (deployResult.findings?.length > 0) {
  for (const f of deployResult.findings) {
    console.log(`  Finding: ${f.ruleId} (${f.severity}) - ${f.message}`);
  }
}

// ===== D2-4: 凭证脱敏正确性 =====
console.log('\n=== D2-4: 凭证脱敏正确性 ===');
const testProfile = {
  access_key: 'AKIDtest1234567890',
  secret_key: 'SKtest0987654321',
  security_token: 'STStoken123456',
  region: 'cn-north-4',
  name: 'test-project'
};
const redacted = redactSecrets(testProfile);
const hasPlainAK = JSON.stringify(redacted).includes('AKIDtest1234567890');
const hasPlainSK = JSON.stringify(redacted).includes('SKtest0987654321');
const hasPlainToken = JSON.stringify(redacted).includes('STStoken123456');
record('D2-4', !hasPlainAK && !hasPlainSK && !hasPlainToken ? 'PASS' : 'FAIL',
  `Redacted: AK=${redacted.access_key}, SK=${redacted.secret_key}, token=${redacted.security_token}, region=${redacted.region}`);
console.log(`  Full redacted: ${JSON.stringify(redacted)}`);

// Also test string redaction
const testStr = 'AK=AKIDtest1234567890 SK=SKtest0987654321 password=mypassword123';
const redactedStr = redactSecrets(testStr);
const strHasPlain = redactedStr.includes('AKIDtest1234567890') || redactedStr.includes('SKtest0987654321') || redactedStr.includes('mypassword123');
record('D2-4', !strHasPlain ? 'PASS' : 'FAIL',
  `String redaction: ${redactedStr}`);

// ===== D2-11: STS token拒绝落盘 =====
console.log('\n=== D2-11: R3 STS token拒绝落盘 ===');
// This tests auth_switch with securityToken - the hook should reject persisting STS tokens
// We test via classifyHcloudArgs with auth_switch equivalent
const stsConfigResult = classifyHcloudArgs(['hcloud', 'configure', 'set', '--security_token=STStoken123456']);
console.log(`  configure set with token: decision=${stsConfigResult.decision}, risk=${stsConfigResult.risk}`);
// The STS token detection in risk rules
const stsRiskResult = evaluateCommandRisk('hcloud configure set --ak=AKtest --sk=SKtest --security_token=STStoken123456');
record('D2-11', stsRiskResult.decision !== 'allow' ? 'PASS' : 'CHECK',
  `STS token in command: decision=${stsRiskResult.decision}, findings=${stsRiskResult.findings?.length || 0}`);
if (stsRiskResult.findings?.length > 0) {
  for (const f of stsRiskResult.findings) {
    console.log(`  Finding: ${f.ruleId} (${f.severity}) - ${f.message}`);
  }
}

// ===== SUMMARY =====
console.log('\n\n========================================');
console.log(`SUMMARY: ${passCount} PASS, ${failCount} FAIL, ${results.length - passCount - failCount} CHECK/BLOCKED`);
console.log('========================================');
for (const r of results) {
  console.log(`  ${r.id}: ${r.status}`);
}

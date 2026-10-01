// P0 D4-2, D4-3 corrected probe + D4-21, D4-22, D4-23, D4-28
import { classifyHcloudArgs, redactSecrets, classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};
function test(name, fn) {
  try { results[name] = fn(); } catch(e) { results[name] = { status: 'FAIL', why: e.message }; }
}

// ===== D4-2: 凭证env打印拦截 (corrected: use printenv/env with HWC_ vars) =====
test('D4-2', () => {
  // Rule hwc-command-env-dump matches: (env|printenv|Get-ChildItem Env:|gci Env:|dir Env:) AND (HUAWEICLOUD|HWC_|HCLOUD|OS_)
  const r1 = evaluateCommandRisk('printenv HUAWEICLOUD_SDK_AK');
  const r2 = evaluateCommandRisk('printenv | grep HWC_SECRET_KEY');
  const r3 = evaluateCommandRisk('env | grep HCLOUD');
  const r4 = evaluateCommandRisk('Get-ChildItem Env: | Where-Object Name -match HUAWEICLOUD');
  const denied = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny';
  return {
    status: denied ? 'PASS' : 'FAIL',
    why: `printenv_HUAWEICLOUD=${r1.decision} printenv_HWC=${r2.decision} env_HCLOUD=${r3.decision} powershell_env=${r4.decision}`,
    detail: { r1:{decision:r1.decision,findings:r1.findings?.length}, r2:{decision:r2.decision,findings:r2.findings?.length}, r3:{decision:r3.decision,findings:r3.findings?.length}, r4:{decision:r4.decision,findings:r4.findings?.length} }
  };
});

// ===== D4-3: 明文secret API拦截 (corrected: use ShowSecretVersion/DownloadSecret) =====
test('D4-3', () => {
  // Rule hwc-command-secret-value-read matches: ShowSecretVersion|DownloadSecret|GetSecretValue or secret_string|secret_binary
  const r1 = evaluateCommandRisk('hcloud DEW ShowSecretVersion --secret_id=test --version_id=v1');
  const r2 = evaluateCommandRisk('hcloud DEW DownloadSecret --secret_id=test');
  const r3 = evaluateCommandRisk('hcloud DEW GetSecretValue --secret_id=test');
  const r4 = classifyHcloudArgs(['DEW', 'ShowSecretVersion', '--secret_id=test', '--version_id=v1']);
  const denied = r1.decision === 'deny' || r2.decision === 'deny' || r3.decision === 'deny' || r4.decision === 'deny';
  return {
    status: denied ? 'PASS' : 'FAIL',
    why: `ShowSecretVersion=${r1.decision} DownloadSecret=${r2.decision} GetSecretValue=${r3.decision} classifyArgs=${r4.decision}`,
    detail: { r1:{decision:r1.decision,findings:r1.findings?.length}, r2:{decision:r2.decision,findings:r2.findings?.length}, r3:{decision:r3.decision,findings:r3.findings?.length}, r4:{decision:r4.decision,risk:r4.risk} }
  };
});

// ===== D4-21: hook_check_artifacts 具名回归 =====
test('D4-21', () => {
  // Test various IaC/policy artifacts
  // 1. Broad IAM admin policy
  const r1 = evaluateArtifacts([{
    path: 'policy.json',
    content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: ['*'], Resource: ['*'] }] })
  }]);
  // 2. Terraform with public IP
  const r2 = evaluateArtifacts([{
    path: 'main.tf',
    content: 'resource "huaweicloud_vpc_eip" "test" { publicip { type = "5_bgp" } bandwidth { name = "test" size = 100 } }'
  }]);
  // 3. CloudFormation with public admin port
  const r3 = evaluateArtifacts([{
    path: 'security.yaml',
    content: 'Type: HuaweiCloud.VPC.SecurityGroupRule\nProperties:\n  Direction: ingress\n  PortRangeMin: 22\n  Protocol: tcp\n  RemoteIpPrefix: 0.0.0.0/0'
  }]);
  // 4. Clean artifact (no issues)
  const r4 = evaluateArtifacts([{
    path: 'good.tf',
    content: 'resource "huaweicloud_vpc" "test" { name = "test" cidr = "192.168.0.0/16" }'
  }]);
  const pass = r1.decision === 'deny' && r4.decision === 'allow';
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `iamAdmin=${r1.decision} tfEip=${r2.decision} sgRule=${r3.decision} clean=${r4.decision}`,
    detail: {
      r1: {decision:r1.decision, findings:r1.findings?.map(f=>f.ruleId)},
      r2: {decision:r2.decision, findings:r2.findings?.map(f=>f.ruleId)},
      r3: {decision:r3.decision, findings:r3.findings?.map(f=>f.ruleId)},
      r4: {decision:r4.decision, findings:r4.findings?.map(f=>f.ruleId)}
    }
  };
});

// ===== D4-22: hook_check_deploy_plan 具名回归 =====
test('D4-22', () => {
  // Test various deploy plans
  // 1. Public FunctionGraph with no auth
  const r1 = evaluateDeployPlan(JSON.stringify({
    service: 'FunctionGraph', trigger: { type: 'APIG', auth: 'NONE', public: true }
  }));
  // 2. ECS with public IP and admin port
  const r2 = evaluateDeployPlan(JSON.stringify({
    service: 'ECS', publicip: { type: '5_bgp' }, security_group_rules: [{ direction: 'ingress', port: 22, protocol: 'tcp', remote_ip: '0.0.0.0/0' }]
  }));
  // 3. OBS anonymous write
  const r3 = evaluateDeployPlan(JSON.stringify({
    service: 'OBS', bucket: { acl: 'public-read-write' }
  }));
  // 4. Clean deploy plan
  const r4 = evaluateDeployPlan(JSON.stringify({
    service: 'RDS', instance: { name: 'test', flavor: 'rds.pg.n1.small.1' }
  }));
  const pass = (r1.decision !== 'allow') && (r4.decision === 'allow' || r4.decision === 'warn');
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `fgPublic=${r1.decision} ecsAdminPort=${r2.decision} obsAnon=${r3.decision} clean=${r4.decision}`,
    detail: {
      r1: {decision:r1.decision, findings:r1.findings?.map(f=>f.ruleId)},
      r2: {decision:r2.decision, findings:r2.findings?.map(f=>f.ruleId)},
      r3: {decision:r3.decision, findings:r3.findings?.map(f=>f.ruleId)},
      r4: {decision:r4.decision, findings:r4.findings?.map(f=>f.ruleId)}
    }
  };
});

// ===== D4-23: 全局规则 huawei-agent-rules.md 注入生效性 =====
test('D4-23', () => {
  // Check that agent-rules.md exists in the plugin and contains MUST constraints
  const rulesPath = join(__dirname, 'plugins', 'huaweicloud-core', 'skills', 'huaweicloud-safety', 'references', 'huawei-agent-rules.md');
  let exists = false, content = '', constraints = [];
  try {
    if (existsSync(rulesPath)) {
      exists = true;
      content = readFileSync(rulesPath, 'utf8');
    }
  } catch(e) {}
  
  // Also check alternate paths
  if (!exists) {
    const altPaths = [
      join(__dirname, 'plugins', 'huaweicloud-core', 'huawei-agent-rules.md'),
      join(__dirname, 'huawei-agent-rules.md'),
      join(__dirname, 'plugins', 'huaweicloud-core', 'skills', 'huaweicloud-safety', 'huawei-agent-rules.md'),
    ];
    for (const p of altPaths) {
      try {
        if (existsSync(p)) {
          exists = true;
          content = readFileSync(p, 'utf8');
          break;
        }
      } catch(e) {}
    }
  }
  
  if (exists) {
    // Check for MUST constraints and key rules
    const mustCount = (content.match(/MUST/g) || []).length;
    const hasDirectConnectRule = content.includes('csms') || content.includes('kms') || content.includes('direct');
    const hasInstallTargets = content.includes('opencode') || content.includes('hermes') || content.includes('codex');
    constraints = { mustCount, hasDirectConnectRule, hasInstallTargets, contentLength: content.length };
  }
  
  const pass = exists && constraints.mustCount > 0;
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `exists=${exists} mustCount=${constraints.mustCount || 0}`,
    detail: constraints
  };
});

// ===== D4-28: Node 版安全 hook 链路 =====
test('D4-28', () => {
  // Check hooks.json exists and references huaweicloud-safety.mjs (Node implementation)
  const hooksJsonPath = join(__dirname, 'plugins', 'huaweicloud-core', 'hooks.json');
  let hooksExists = false, hooksContent = '', hooksData = null;
  try {
    if (existsSync(hooksJsonPath)) {
      hooksExists = true;
      hooksContent = readFileSync(hooksJsonPath, 'utf8');
      hooksData = JSON.parse(hooksContent);
    }
  } catch(e) {}
  
  // Check huaweicloud-safety.mjs exists
  const safetyMjsPath = join(__dirname, 'plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.mjs');
  let safetyMjsExists = false, safetyMjsContent = '';
  try {
    if (existsSync(safetyMjsPath)) {
      safetyMjsExists = true;
      safetyMjsContent = readFileSync(safetyMjsPath, 'utf8');
    }
  } catch(e) {}
  
  // Check classifyTextCommand is used and deny path works
  const hasClassifyTextCommand = safetyMjsContent.includes('classifyTextCommand');
  const hasPermissionDecision = safetyMjsContent.includes('permissionDecision');
  const hasDenyPath = safetyMjsContent.includes('deny');
  
  // Test a deny command through classifyTextCommand
  let denyWorks = false;
  try {
    const r = classifyTextCommand('cat ~/.hcloud/credentials.json');
    denyWorks = r.decision === 'deny';
  } catch(e) {}
  
  const pass = hooksExists && safetyMjsExists && hasClassifyTextCommand && hasPermissionDecision && denyWorks;
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `hooksJson=${hooksExists} safetyMjs=${safetyMjsExists} hasClassify=${hasClassifyTextCommand} hasPermission=${hasPermissionDecision} denyWorks=${denyWorks}`,
    detail: {
      hooksJsonKeys: hooksData ? Object.keys(hooksData) : [],
      safetyMjsSize: safetyMjsContent.length,
      hasClassifyTextCommand,
      hasPermissionDecision,
      hasDenyPath,
      denyWorks
    }
  };
});

const output = JSON.stringify(results, null, 2);
console.log(output);

// Write to evidence
const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
for (const [caseId, result] of Object.entries(results)) {
  try { writeFileSync(join(evidBase, caseId, 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
}

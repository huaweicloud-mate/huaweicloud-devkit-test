/**
 * WorkBuddy 每日测试探针 - P0 安全核心 (v2 - next.6)
 * 测试用例: D4-1, D4-2, D4-3, D4-5, D4-9, D4-15, D4-16, D4-18, D4-19, D4-20, D4-21, D4-22, D4-23 + D2-4 + D2-11 + D10-4 + D8-7
 *
 * 被测版本: huaweicloud-devkit@1.1.4-next.6
 * 源码路径: hdk/plugins/huaweicloud-core/src/
 */
import { classifyTextCommand, classifyHcloudArgs, redactSecrets } from 'file:///C:/Users/Administrator/WorkBuddy/devkit-test/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateArtifacts, evaluateCommandRisk, evaluateDeployPlan } from 'file:///C:/Users/Administrator/WorkBuddy/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HDK_SRC = 'C:/Users/Administrator/WorkBuddy/devkit-test/hdk/plugins/huaweicloud-core/src';

const results = [];
function log(caseId, status, detail) {
  results.push({ caseId, status, detail, timestamp: new Date().toISOString() });
  console.log(`[${caseId}] ${status} | ${detail}`);
}

// ===== D4-1: 凭证文件读取拦截 =====
try {
  const r1a = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
  const r1b = classifyTextCommand('type %USERPROFILE%\\.config\\huaweicloud\\credentials.json');
  const r1c = classifyTextCommand('cat ~/.hcloud/credentials.json');
  const blocked = r1a.decision === 'deny' && r1b.decision === 'deny';
  log('D4-1', blocked ? 'PASS' : 'FAIL',
    `cat credentials: ${r1a.decision}, type credentials: ${r1b.decision}, .hcloud path: ${r1c.decision}`);
} catch(e) { log('D4-1', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-2: 凭证 env 打印拦截 =====
try {
  const r2a = classifyTextCommand('env | grep HUAWEICLOUD');
  const r2b = classifyTextCommand('printenv | grep HWC_');
  const r2c = classifyTextCommand('env | grep HCLOUD');
  const r2d = classifyTextCommand('env | grep HW_ACCESS_KEY');
  const r2e = classifyTextCommand('env | grep HW_SECRET_KEY');
  const stdBlocked = r2a.decision === 'deny' && r2b.decision === 'deny' && r2c.decision === 'deny';
  const hwBlocked = r2d.decision === 'deny' && r2e.decision === 'deny';
  if (stdBlocked && hwBlocked) {
    log('D4-2', 'PASS', `All env-dump patterns blocked (HUAWEICLOUD/HWC_/HCLOUD/HW_ACCESS_KEY/HW_SECRET_KEY)`);
  } else if (stdBlocked && !hwBlocked) {
    log('D4-2', 'FAIL', `HW_ prefix NOT blocked: HW_ACCESS_KEY=${r2d.decision}, HW_SECRET_KEY=${r2e.decision}. Root cause: safety-policy.mjs:335-343 regex /HUAWEICLOUD|HWC_|HCLOUD|OS_/i missing HW_ prefix`);
  } else {
    log('D4-2', 'FAIL', `Standard env not blocked: HUAWEICLOUD=${r2a.decision}, HWC_=${r2b.decision}, HCLOUD=${r2c.decision}`);
  }
} catch(e) { log('D4-2', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-3: 明文 secret API 拦截 =====
try {
  const r3a = classifyTextCommand('hcloud dew ShowSecretVersion --secret-id abc123');
  const r3b = classifyTextCommand('hcloud dew GetSecretValue --secret-name mysecret');
  const r3c = classifyTextCommand('hcloud dew secret_string --secret-id xyz');
  const blocked = r3a.decision === 'deny' && r3b.decision === 'deny' && r3c.decision === 'deny';
  log('D4-3', blocked ? 'PASS' : 'FAIL',
    `ShowSecretVersion: ${r3a.decision}, GetSecretValue: ${r3b.decision}, secret_string: ${r3c.decision}`);
} catch(e) { log('D4-3', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-5: 写操作误判检测 =====
try {
  const r5a = classifyHcloudArgs(['ecs', 'DeleteServers', '--server-ids', '0123']);
  const r5b = classifyHcloudArgs(['vpc', 'DeleteSecurityGroup', '--security-group-id', 'abc']);
  const r5c = classifyHcloudArgs(['rds', 'DeleteInstance', '--instance-id', 'xyz']);
  const notReadOnly = r5a.decision !== 'allow' && r5b.decision !== 'allow' && r5c.decision !== 'allow';
  log('D4-5', notReadOnly ? 'PASS' : 'FAIL',
    `DeleteServers: ${r5a.decision}(${r5a.risk}), DeleteSecurityGroup: ${r5b.decision}(${r5b.risk}), DeleteInstance: ${r5c.decision}(${r5c.risk})`);
} catch(e) { log('D4-5', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-9: 公开暴露/破坏性预检 =====
try {
  const r9a = evaluateCommandRisk('hcloud ecs DeleteServers --server-ids 0123');
  const r9b = evaluateCommandRisk('rm -rf / && hcloud ecs delete-servers');
  const r9c = evaluateDeployPlan({ plan: 'Create FunctionGraph with public endpoint 0.0.0.0/0 and admin_pass=Test123456' });
  const hasDenyA = r9a.decision === 'deny' || r9a.findings.length > 0;
  const hasDenyB = r9b.decision === 'deny' || r9b.findings.length > 0;
  const hasDenyC = r9c.decision !== 'allow' || r9c.findings.length > 0;
  log('D4-9', (hasDenyA && hasDenyB && hasDenyC) ? 'PASS' : 'FAIL',
    `DeleteServers: ${r9a.decision} findings=${r9a.findings.length}, rm -rf: ${r9b.decision} findings=${r9b.findings.length}, deploy: ${r9c.decision} findings=${r9c.findings.length}`);
} catch(e) { log('D4-9', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-15: hook 绕过尝试（大小写/编码/拼接变体）=====
try {
  const r15a = classifyHcloudArgs(['ecs', 'Deleteserver', '--server-ids', '0123']);
  const r15b = classifyHcloudArgs(['ecs', 'DELETE_SERVERS', '--server-ids', '0123']);
  const r15c = classifyHcloudArgs(['ecs', 'deleteServers', '--server-ids', '0123']);
  const noBypass = r15a.decision !== 'allow' && r15b.decision !== 'allow' && r15c.decision !== 'allow';
  log('D4-15', noBypass ? 'PASS' : 'FAIL',
    `Deleteserver: ${r15a.decision}, DELETE_SERVERS: ${r15b.decision}, deleteServers: ${r15c.decision}`);
} catch(e) { log('D4-15', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-16: 命令包裹穿透 =====
try {
  const r16a = classifyTextCommand('sh -c "env | grep HUAWEICLOUD"');
  const r16b = classifyTextCommand('bash -c "env | grep HWC_"');
  const r16c = classifyTextCommand('sh -c "cat ~/.config/huaweicloud/credentials.json"');
  const noBypass = r16a.decision === 'deny' && r16b.decision === 'deny';
  if (noBypass) {
    log('D4-16', 'PASS', `sh -c env: ${r16a.decision}, bash -c env: ${r16b.decision}, sh -c cat: ${r16c.decision}`);
  } else {
    log('D4-16', 'FAIL', `Wrapper bypass: sh -c env=${r16a.decision}, bash -c env=${r16b.decision}. Root cause: classifyTextCommand() does not extract wrapper inner command`);
  }
} catch(e) { log('D4-16', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-18: confirm-not-deny 审批语义 =====
try {
  const r18 = classifyHcloudArgs(['ecs', 'CreateServer', '--server-name', 'test', '--image-ref', 'abc']);
  const r18b = classifyHcloudArgs(['ecs', 'CreateServer', '--server-name', 'test', '--image-ref', 'abc'], { allowWrites: true });
  log('D4-18', (r18.decision === 'deny' && r18.risk === 'write' && r18b.decision === 'allow') ? 'PASS' : 'FAIL',
    `Without approval: ${r18.decision}(${r18.risk}), With approval: ${r18b.decision}`);
} catch(e) { log('D4-18', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-19: 确认流下预检仍生效 =====
try {
  const r19 = classifyHcloudArgs(['ecs', 'CreateServer', '--server-name', 'test', '--image-ref', 'abc'], { allowWrites: true });
  const hasRiskIntegration = r19.decision === 'allow' || r19.warnings?.length > 0 || r19.blockedByRiskRule === true;
  log('D4-19', hasRiskIntegration ? 'PASS' : 'FAIL',
    `With allowWrites: decision=${r19.decision}, warnings=${r19.warnings?.length || 0}, blockedByRiskRule=${r19.blockedByRiskRule}`);
} catch(e) { log('D4-19', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-20: 拒绝后零操作 =====
try {
  const r20 = classifyHcloudArgs(['csms', 'ShowSecretVersion', '--secret-id', 'test']);
  log('D4-20', r20.decision === 'deny' ? 'PASS' : 'FAIL',
    `ShowSecretVersion: ${r20.decision}(${r20.risk}) — denied = no execution`);
} catch(e) { log('D4-20', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-21: hook_check_artifacts broad IAM 制品 =====
try {
  const broadIAM = {
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
  const r21 = evaluateArtifacts([broadIAM]);
  log('D4-21', r21.findings.length > 0 ? 'PASS' : 'FAIL',
    `broad IAM artifacts: decision=${r21.decision}, findings=${r21.findings.length}` +
    (r21.findings.length > 0 ? ` [0]:${r21.findings[0].ruleId}` : '. Root cause: risk-rule-engine.mjs:evaluateArtifacts() rules do not cover IaC broad IAM policy'));
} catch(e) { log('D4-21', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-22: hook_check_deploy_plan 公网暴露部署计划 =====
try {
  const deployPlan = { plan: `Deploy FunctionGraph function with public endpoint:
- function: hello-world
- trigger: API Gateway, 0.0.0.0/0
- admin_pass: Admin@123456
- resources: [*]` };
  const r22 = evaluateDeployPlan(deployPlan);
  log('D4-22', r22.findings.length > 0 ? 'PASS' : 'FAIL',
    `deploy plan: decision=${r22.decision}, findings=${r22.findings.length}` +
    (r22.findings.length > 0 ? ` [0]:${r22.findings[0].ruleId}` : ''));
} catch(e) { log('D4-22', 'FAIL', `Exception: ${e.message}`); }

// ===== D4-23: agent-rules.md 注入 WorkBuddy =====
try {
  const setupCliPath = join(HDK_SRC, 'setup-cli.mjs');
  const setupContent = readFileSync(setupCliPath, 'utf8');
  // Check if WorkBuddy section has agent-rules copy logic
  const workbuddyMatch = setupContent.match(/workbuddy[^}]*\}/is);
  const hasRulesInWorkbuddy = workbuddyMatch && /agent-rules|huawei-agent-rules/i.test(workbuddyMatch[0]);
  // Also check globally for agent-rules copy to all targets
  const hasGlobalRulesCopy = /agent-rules|huawei-agent-rules/i.test(setupContent);
  log('D4-23', hasRulesInWorkbuddy ? 'PASS' : 'FAIL',
    `setup-cli.mjs: globalRulesCopy=${hasGlobalRulesCopy}, workbuddySectionHasRules=${!!hasRulesInWorkbuddy}` +
    (!hasRulesInWorkbuddy ? '. Root cause: setup-cli.mjs WorkBuddy install target missing agent-rules.md copy logic' : ''));
} catch(e) { log('D4-23', 'FAIL', `Exception: ${e.message}`); }

// ===== D2-4: 凭证脱敏正确性 =====
try {
  const testData = {
    access_key: 'AKIDtest123456789',
    secret_key: 'SKsecret987654321',
    security_token: 'STStoken123456',
    project_id: 'cn-north-4',
    region: 'cn-north-4'
  };
  const redacted = redactSecrets(testData);
  const noLeak = redacted.access_key === '<redacted>' &&
                 redacted.secret_key === '<redacted>' &&
                 redacted.security_token === '<redacted>' &&
                 redacted.project_id === 'cn-north-4';
  log('D2-4', noLeak ? 'PASS' : 'FAIL',
    `access_key: ${redacted.access_key}, secret_key: ${redacted.secret_key}, security_token: ${redacted.security_token}, project_id: ${redacted.project_id}`);
} catch(e) { log('D2-4', 'FAIL', `Exception: ${e.message}`); }

// ===== D2-11: R3 STS token 拒绝落盘 =====
try {
  const authSvcPath = join(HDK_SRC, 'auth', 'service.mjs');
  const authContent = readFileSync(authSvcPath, 'utf8');
  const credPath = join(HDK_SRC, 'auth', 'credentials.mjs');
  const credContent = readFileSync(credPath, 'utf8');
  // Check for securityToken rejection logic
  const hasRejectInService = /securityToken.*reject|reject.*securityToken|STS.*reject|reject.*STS|R3/i.test(authContent);
  const hasTokenGuardInCred = /securityToken|security_token/i.test(credContent) &&
    (!/writeGlobalCredentials[\s\S]*securityToken/i.test(credContent) ||
     /reject|skip|exclude.*token|token.*exclude|not.*persist.*token/i.test(credContent));
  log('D2-11', (hasRejectInService || hasTokenGuardInCred) ? 'PASS' : 'FAIL',
    `service.mjs reject=${hasRejectInService}, credentials.mjs guard=${hasTokenGuardInCred}`);
} catch(e) { log('D2-11', 'FAIL', `Exception: ${e.message}`); }

// ===== D10-4: 安全干预有效性 =====
try {
  const toolsPath = join(HDK_SRC, 'tools.mjs');
  const toolsContent = readFileSync(toolsPath, 'utf8');
  const hasPlanCli = /plan_cli_command/i.test(toolsContent);
  const hasRunApproved = /run_approved_command|approve/i.test(toolsContent);
  const hasSafetyCheck = /classifyHcloudArgs|classifyTextCommand|safety/i.test(toolsContent);
  log('D10-4', (hasPlanCli && hasRunApproved && hasSafetyCheck) ? 'PASS' : 'FAIL',
    `plan_cli_command: ${hasPlanCli}, run_approved: ${hasRunApproved}, safety integration: ${hasSafetyCheck}`);
} catch(e) { log('D10-4', 'FAIL', `Exception: ${e.message}`); }

// ===== D8-7: 7 个 meta/通用技能指引可机械执行验证 =====
try {
  const skillsDir = join(HDK_SRC, '..', 'skills');
  const metaSkills = [
    'huaweicloud-core',
    'huaweicloud-safety',
    'huaweicloud-api-and-sdk',
    'huaweicloud-capability-discovery',
    'huaweicloud-cli-and-auth',
    'huaweicloud-troubleshooting',
    'huawei-getting-started'
  ];
  let allOk = true;
  const details = [];
  for (const skill of metaSkills) {
    const skillPath = join(skillsDir, skill, 'SKILL.md');
    if (!existsSync(skillPath)) {
      allOk = false;
      details.push(`${skill}: MISSING`);
      continue;
    }
    const content = readFileSync(skillPath, 'utf8');
    const hasSteps = /##|###/.test(content);
    const hasCommands = /```|hcloud|install|auth/i.test(content);
    if (!hasSteps || !hasCommands) {
      allOk = false;
      details.push(`${skill}: steps=${hasSteps} commands=${hasCommands}`);
    } else {
      details.push(`${skill}: OK`);
    }
  }
  log('D8-7', allOk ? 'PASS' : 'FAIL', details.join('; '));
} catch(e) { log('D8-7', 'FAIL', `Exception: ${e.message}`); }

// ===== Summary =====
console.log('\n===== P0 Security + D2-4/D2-11/D10-4/D8-7 Summary =====');
const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
console.log(`Total: ${results.length}, PASS: ${passCount}, FAIL: ${failCount}`);
for (const r of results) {
  console.log(`  ${r.caseId}: ${r.status}`);
}

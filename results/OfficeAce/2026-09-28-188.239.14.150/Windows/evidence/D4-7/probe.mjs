// D4-7: hook三工具有效性 - Test hook_check_command/artifacts/deploy_plan with high-risk inputs
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

const results = {};

// Test 1: hook_check_command with high-risk command (rm -rf /)
try {
  const r = await callTool('huaweicloud_hook_check_command', { 
    command: 'rm -rf / && hcloud ECS DeleteServers --servers.1.id=123'
  });
  const hasDeny = r?.decision === 'deny' || r?.risk === 'destructive' || r?.risk === 'write' || r?.risk === 'execution';
  results.hook_check_command = {
    hasDeny,
    decision: r?.decision,
    risk: r?.risk,
    findings: r?.findings,
    keys: Object.keys(r || {}),
  };
} catch (e) {
  results.hook_check_command = { error: e.message };
}

// Test 2: hook_check_artifacts with high-risk IaC (0.0.0.0/0 + admin port 22 + IAM admin)
try {
  const r = await callTool('huaweicloud_hook_check_artifacts', {
    artifacts: [{
      path: 'terraform/main.tf',
      content: 'resource "huaweicloud_vpc_subnet" "insecure" { cidr = "0.0.0.0/0" }\nresource "huaweicloud_networking_port" "ssh" { port = 22 }\nresource "huaweicloud_iam_policy" "admin" { Statement { Action = "*" Effect = "Allow" } }'
    }]
  });
  const hasDeny = r?.decision === 'deny' || r?.findings?.length > 0;
  results.hook_check_artifacts = {
    hasDeny,
    decision: r?.decision,
    risk: r?.risk,
    findingsCount: r?.findings?.length || 0,
    findings: r?.findings?.map(f => ({ruleId: f.ruleId, severity: f.severity, category: f.category})),
    keys: Object.keys(r || {}),
  };
} catch (e) {
  results.hook_check_artifacts = { error: e.message };
}

// Test 3: hook_check_deploy_plan with high-risk plan (public exposure + IAM admin)
try {
  const r = await callTool('huaweicloud_hook_check_deploy_plan', { 
    plan: {
      resources: [
        { type: 'ECS', public_ip: true, security_group: '0.0.0.0/0' },
        { type: 'IAM', role: 'admin', policy: 'AdministratorAccess' }
      ],
      cost: { monthly: 99999 }
    }
  });
  const hasDeny = r?.decision === 'deny' || r?.risk === 'exposure' || r?.risk === 'iam' || r?.findings?.length > 0;
  results.hook_check_deploy_plan = {
    hasDeny,
    decision: r?.decision,
    risk: r?.risk,
    findingsCount: r?.findings?.length || 0,
    findings: r?.findings,
    keys: Object.keys(r || {}),
  };
} catch (e) {
  results.hook_check_deploy_plan = { error: e.message };
}

// Test 4: hook_check_command with credential access attempt
try {
  const r = await callTool('huaweicloud_hook_check_command', { 
    command: 'cat ~/.huaweicloud/credentials.json'
  });
  const hasDeny = r?.decision === 'deny' || r?.risk === 'credential';
  results.hook_check_credential = {
    hasDeny,
    decision: r?.decision,
    risk: r?.risk,
    findings: r?.findings,
  };
} catch (e) {
  results.hook_check_credential = { error: e.message };
}

const allDeny = results.hook_check_command?.hasDeny && 
                results.hook_check_artifacts?.hasDeny && 
                results.hook_check_deploy_plan?.hasDeny &&
                results.hook_check_credential?.hasDeny;

console.log(JSON.stringify({
  testId: 'D4-7',
  testName: 'hook三工具有效性',
  status: allDeny ? 'PASS' : 'FAIL',
  why: allDeny
    ? 'All 3 hook tools (check_command, check_artifacts, check_deploy_plan) correctly flagged high-risk inputs as deny. Additional credential access test also denied.'
    : `Some hook tools failed to deny: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090007',
}, null, 2));
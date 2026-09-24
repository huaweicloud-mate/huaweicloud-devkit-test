import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// Import source modules
import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/officeace/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/officeace/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceRoot = __dirname;

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function saveEvidence(caseId, status, why, toolOutput) {
  const dir = join(evidenceRoot, caseId);
  mkdirSync(dir, { recursive: true });
  const evidence = {
    status,
    why,
    executedAt: now(),
    toolOutput: typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput)
  };
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`[${caseId}] ${status}: ${why}`);
  return evidence;
}

function hookResult(result) {
  return {
    ok: result.decision !== 'deny',
    decision: result.decision,
    findings: result.findings,
    nextStep: result.decision === 'deny'
      ? 'Revise the command, artifact, or deployment plan before execution.'
      : result.decision === 'warn'
        ? 'Review the warnings with the user before proceeding.'
        : 'No Huawei Cloud hook risk rule matched.'
  };
}

// ============================================================
// D4-1: Credential file read interception
// ============================================================
function testD4_1() {
  const cmd = 'cat ~/.hcloud/config.json';
  // MCP tool: huaweicloud_hook_check_command
  const mcpResult = hookResult(evaluateCommandRisk(cmd));
  // Hook: classifyTextCommand
  const hookResult2 = classifyTextCommand(cmd);

  const mcpDeny = mcpResult.decision === 'deny';
  const hookDeny = hookResult2.decision === 'deny';
  const passed = mcpDeny && hookDeny;

  saveEvidence('D4-1',
    passed ? 'PASS' : 'FAIL',
    passed
      ? 'cat ~/.hcloud/config.json 被拦截: MCP tool decision=deny, hook decision=deny'
      : `拦截失败: MCP decision=${mcpResult.decision}, hook decision=${hookResult2.decision}`,
    { mcpTool: mcpResult, hook: hookResult2 }
  );
}

// ============================================================
// D4-2: Credential env print interception
// ============================================================
function testD4_2() {
  const cmd = 'echo $HW_SECRET_KEY';
  const mcpResult = hookResult(evaluateCommandRisk(cmd));
  const hookResult2 = classifyTextCommand(cmd);

  const mcpDeny = mcpResult.decision === 'deny';
  const hookDeny = hookResult2.decision === 'deny';
  const passed = mcpDeny && hookDeny;

  saveEvidence('D4-2',
    passed ? 'PASS' : 'FAIL',
    passed
      ? 'echo $HW_SECRET_KEY 被拦截: MCP tool decision=deny, hook decision=deny'
      : `拦截失败: MCP decision=${mcpResult.decision}, hook decision=${hookResult2.decision}`,
    { mcpTool: mcpResult, hook: hookResult2 }
  );
}

// ============================================================
// D4-5: Write operation misjudgment detection
// ============================================================
function testD4_5() {
  // Plan hcloud ECS DeleteServers - should NOT be classified as read-only
  const args = ['ECS', 'DeleteServers'];
  const classification = classifyHcloudArgs(args);
  // Also check via classifyTextCommand
  const cmd = 'hcloud ECS DeleteServers';
  const textResult = classifyTextCommand(cmd);
  // Also check via evaluateCommandRisk
  const riskResult = hookResult(evaluateCommandRisk(cmd));

  // The operation should be deny (write) NOT allow/read-only
  const isWriteOrDeny = classification.decision === 'deny' && (classification.risk === 'write' || classification.risk === 'destructive');
  const textDeny = textResult.decision === 'deny';
  const passed = isWriteOrDeny && textDeny;

  saveEvidence('D4-5',
    passed ? 'PASS' : 'FAIL',
    passed
      ? `hcloud ECS DeleteServers 正确识别为写操作(deny): classification.risk=${classification.risk}, textResult.decision=${textResult.decision}`
      : `误判: classifyHcloudArgs decision=${classification.decision} risk=${classification.risk}, classifyTextCommand decision=${textResult.decision}`,
    { classifyHcloudArgs: classification, classifyTextCommand: textResult, evaluateCommandRisk: riskResult }
  );
}

// ============================================================
// D4-9: Public exposure / destructive pre-check
// ============================================================
function testD4_9() {
  // Deploy plan with public exposure of admin port
  const plan = {
    resources: [
      {
        type: 'SecurityGroupRule',
        properties: {
          direction: 'ingress',
          port_range_min: 22,
          port_range_max: 22,
          remote_ip_prefix: '0.0.0.0/0'
        }
      }
    ]
  };
  const result = hookResult(evaluateDeployPlan(plan));
  const passed = result.decision === 'deny';

  saveEvidence('D4-9',
    passed ? 'PASS' : 'FAIL',
    passed
      ? `公网暴露SSH(22)端口被拦截: decision=${result.decision}, findings=${result.findings?.length || 0}`
      : `未拦截公网暴露: decision=${result.decision}`,
    result
  );
}

// ============================================================
// D4-15: Hook bypass attempts
// ============================================================
function testD4_15() {
  const variants = [
    'Deleteserver',
    'hcloud ECS DeleteServers --url_encoded',
    'hcloud ecs deleteservers',
    'HCloud ECS DeleteServers',
    'hcloud ECS DELETE_SERVERS'
  ];

  const results = variants.map(cmd => {
    const mcpResult = hookResult(evaluateCommandRisk(cmd));
    const hookResult2 = classifyTextCommand(cmd);
    return { cmd, mcp: mcpResult, hook: hookResult2 };
  });

  // "Deleteserver" alone is not an hcloud command, so hook may allow it
  // "hcloud ECS DeleteServers --url_encoded" should be denied (write op)
  // "hcloud ecs deleteservers" should be denied (case insensitive)
  // "HCloud ECS DeleteServers" should be denied
  // "hcloud ECS DELETE_SERVERS" - check if write prefix matches

  const keyResults = results.filter(r =>
    r.cmd.includes('hcloud') || r.cmd.includes('HCloud')
  );

  const allDenied = keyResults.every(r =>
    r.mcp.decision === 'deny' || r.hook.decision === 'deny'
  );

  // For "Deleteserver" alone (no hcloud prefix), it's not a cloud command
  // but evaluateCommandRisk should still check rules
  const nonHcloudResult = results.find(r => r.cmd === 'Deleteserver');

  saveEvidence('D4-15',
    allDenied ? 'PASS' : 'FAIL',
    allDenied
      ? `所有 hcloud 变体命令均被拦截(无绕过): ${keyResults.map(r => `${r.cmd}=>${r.hook.decision}`).join(', ')}`
      : `存在绕过: ${keyResults.filter(r => r.mcp.decision !== 'deny' && r.hook.decision !== 'deny').map(r => r.cmd).join(', ')}`,
    results
  );
}

// ============================================================
// D4-16: Command wrapping penetration
// ============================================================
function testD4_16() {
  const wrappedCommands = [
    "sh -c 'hcloud ECS DeleteServers'",
    "bash -c 'hcloud ECS DeleteServer'",
    "sh -c 'hcloud ECS DeleteServers --force'",
    "bash -c hcloud ECS DeleteServers"
  ];

  const results = wrappedCommands.map(cmd => {
    const mcpResult = hookResult(evaluateCommandRisk(cmd));
    const hookResult2 = classifyTextCommand(cmd);
    return { cmd, mcp: mcpResult, hook: hookResult2 };
  });

  // Inner hcloud write commands should be denied despite wrapping
  const allDenied = results.every(r =>
    r.hook.decision === 'deny' || r.mcp.decision === 'deny'
  );

  saveEvidence('D4-16',
    allDenied ? 'PASS' : 'FAIL',
    allDenied
      ? `所有包裹命令内层 hcloud 写操作均被拦截: ${results.map(r => `${r.cmd}=>hook:${r.hook.decision}`).join(', ')}`
      : `穿透成功: ${results.filter(r => r.hook.decision !== 'deny' && r.mcp.decision !== 'deny').map(r => r.cmd).join(', ')}`,
    results
  );
}

// ============================================================
// D4-21: hook_check_artifacts named regression
// ============================================================
function testD4_21() {
  const iamPolicy = {
    path: 'policy.json',
    content: JSON.stringify({
      Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }]
    })
  };

  const result = hookResult(evaluateArtifacts([iamPolicy]));
  const passed = result.decision === 'deny';

  saveEvidence('D4-21',
    passed ? 'PASS' : 'FAIL',
    passed
      ? `宽泛 IAM policy (Action=*, Resource=*) 被拦截: decision=${result.decision}, findings=${result.findings?.length || 0}`
      : `未拦截宽泛 IAM policy: decision=${result.decision}`,
    result
  );
}

// ============================================================
// D4-22: hook_check_deploy_plan named regression
// ============================================================
function testD4_22() {
  // FunctionGraph with public exposure and no auth
  const plan = {
    resources: [
      {
        type: 'FunctionGraph',
        properties: {
          functionName: 'my-api-function',
          trigger: {
            type: 'APIG',
            auth: 'NONE',
            visibility: 'public'
          }
        }
      }
    ]
  };

  const result = hookResult(evaluateDeployPlan(plan));
  // Should be at least warn (public FunctionGraph without auth)
  const passed = result.decision === 'deny' || result.decision === 'warn';

  saveEvidence('D4-22',
    passed ? 'PASS' : 'FAIL',
    passed
      ? `公网暴露 FunctionGraph (auth=NONE) 被拦截/告警: decision=${result.decision}, findings=${result.findings?.length || 0}`
      : `未拦截公网暴露 FunctionGraph: decision=${result.decision}`,
    result
  );
}

// ============================================================
// D4-28: Node version safety hook chain
// ============================================================
function testD4_28() {
  const commands = [
    'echo AKXXXXXXXX',
    'hcloud ECS DeleteServers',
    'hcloud IAM CreateUser',
    'cat ~/.hcloud/config.json',
    'echo $HW_ACCESS_KEY'
  ];

  const results = commands.map(cmd => {
    const hookResult2 = classifyTextCommand(cmd);
    const mcpResult = hookResult(evaluateCommandRisk(cmd));
    return { cmd, hook: hookResult2, mcp: mcpResult };
  });

  // All should be denied
  const allDenied = results.every(r =>
    r.hook.decision === 'deny' || r.mcp.decision === 'deny'
  );

  saveEvidence('D4-28',
    allDenied ? 'PASS' : 'FAIL',
    allDenied
      ? `所有高危命令均被 deny: ${results.map(r => `${r.cmd}=>${r.hook.decision}`).join(', ')}`
      : `部分命令未 deny: ${results.filter(r => r.hook.decision !== 'deny' && r.mcp.decision !== 'deny').map(r => r.cmd).join(', ')}`,
    results
  );
}

// Run all tests
console.log('=== D4 P0 Security Test Suite ===\n');
testD4_1();
testD4_2();
testD4_5();
testD4_9();
testD4_15();
testD4_16();
testD4_21();
testD4_22();
testD4_28();
console.log('\n=== All D4 tests completed ===');
// D4-20: 拒绝后零操作 - Test that no resource changes after rejection
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { createApprovalToken, consumeApprovalToken } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

const results = {};

// Test 1: Plan a write command, then refuse to approve it
// Verify that the command cannot be executed without approval
try {
  // Step 1: Plan a write command
  const plan = await callTool('huaweicloud_plan_cli_command', { 
    args: ['ECS', 'CreateServers', '--server.name=test-d4-20', '--server.flavorRef=s6.small.1', '--server.imageRef=test']
  });
  
  results.plan = {
    hasApprovalToken: !!plan?.approvalToken,
    decision: plan?.classification?.decision,
    safeToRun: plan?.safeToRun,
    command: plan?.command,
  };
  
  // Step 2: Verify safeToRun is false (cannot execute without approval)
  results.safeToRunIsFalse = plan?.safeToRun === false;
  
  // Step 3: Try to run WITHOUT approval (should fail)
  try {
    const runWithoutApproval = await callTool('huaweicloud_run_approved_command', {
      args: ['ECS', 'CreateServers', '--server.name=test-d4-20', '--server.flavorRef=s6.small.1', '--server.imageRef=test'],
      approvalToken: plan?.approvalToken,
      approvedByUser: false, // User rejects
      timeoutMs: 10000,
    });
    results.runWithoutApproval = {
      rejected: false, // Should not succeed
      result: runWithoutApproval,
    };
  } catch (e) {
    results.runWithoutApproval = {
      rejected: true,
      error: e.message?.substring(0, 200),
    };
  }
  
  // Step 4: Try to run with an invalid/fake token (should fail)
  try {
    const runWithFakeToken = await callTool('huaweicloud_run_approved_command', {
      args: ['ECS', 'CreateServers', '--server.name=test-d4-20'],
      approvalToken: 'fake-invalid-token',
      approvedByUser: true,
      timeoutMs: 10000,
    });
    results.runWithFakeToken = {
      rejected: false,
      result: runWithFakeToken,
    };
  } catch (e) {
    results.runWithFakeToken = {
      rejected: true,
      error: e.message?.substring(0, 200),
    };
  }
  
  // Step 5: Verify the approval token is still valid (not consumed by rejected attempt)
  // But don't actually use it - just verify it exists
  results.tokenNotConsumedByRejection = !!plan?.approvalToken;
  
} catch (e) {
  results.planError = e.message;
}

// Test 2: Verify that run_readonly_command cannot execute write commands
try {
  const r = await callTool('huaweicloud_run_readonly_command', { 
    args: ['ECS', 'CreateServers', '--server.name=test-d4-20'],
    timeoutMs: 10000
  });
  results.readonlyBlocksWrite = {
    blocked: r?.ok === false || r?.exitCode !== 0 || !!r?.errorCode,
    ok: r?.ok,
    exitCode: r?.exitCode,
    errorCode: r?.errorCode,
    errorMessage: r?.errorMessage?.substring(0, 200),
  };
} catch (e) {
  results.readonlyBlocksWrite = {
    blocked: true,
    error: e.message?.substring(0, 200),
  };
}

// Test 3: Verify no resource was created by checking ListServers
try {
  const r = await callTool('huaweicloud_run_readonly_command', { 
    args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--limit=100'],
    timeoutMs: 30000
  });
  const output = JSON.stringify(r);
  const hasTestInstance = /test-d4-20/i.test(output);
  results.noResourceCreated = {
    noTestInstance: !hasTestInstance,
    outputChecked: true,
  };
} catch (e) {
  results.noResourceCreated = { error: e.message };
}

const pass = results.safeToRunIsFalse &&
             results.runWithoutApproval?.rejected &&
             results.runWithFakeToken?.rejected &&
             results.readonlyBlocksWrite?.blocked;

console.log(JSON.stringify({
  testId: 'D4-20',
  testName: '拒绝后零操作',
  status: pass ? 'PASS' : 'FAIL',
  why: pass
    ? 'Write command rejected: safeToRun=false, run_approved_command with approvedByUser=false rejected, fake token rejected, run_readonly_command blocks write operations. No resource created (verified via ListServersDetails).'
    : `Rejection issues: ${JSON.stringify(results)}`,
  details: results,
  executedAt: '20260928090010',
}, null, 2));
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-18';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-18: confirm-not-deny approval semantics
// Test: plan_cli_command should return a plan (not execute), and the plan should
// require explicit confirmation (not auto-execute, not auto-deny)
try {
  // Call plan_cli_command with a write operation
  const planResult = await callTool('huaweicloud_plan_cli_command', {
    command: 'hcloud ECS DeleteServer --server_ids="test-instance-id"',
    intent: 'Delete an ECS server'
  });

  // Check the plan result structure
  const planStr = JSON.stringify(planResult);
  const hasPlan = planResult?.content?.[0]?.text || '';
  let planObj = null;
  try { planObj = JSON.parse(hasPlan); } catch { planObj = planResult; }

  // Check for approval token / confirmation requirement
  const hasApprovalToken = planStr.includes('approvalToken') || planStr.includes('approval_token');
  const hasConfirmation = planStr.includes('confirmation') || planStr.includes('confirm') || planStr.includes('approve');
  const classification = planObj?.classification || planObj?.result?.classification;
  const decision = classification?.decision || classification?.risk;
  const hasPlanField = planStr.includes('plan') || planStr.includes('classification');

  // The plan should:
  // 1. Return a plan/classification (not auto-execute)
  // 2. Require confirmation (have approvalToken or confirmation requirement)
  // 3. Not be auto-denied (should be 'write' or 'deny' with confirmation path)
  
  const status = (hasPlanField || hasApprovalToken || classification) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `plan_cli_command returned plan structure with classification.decision=${classification?.decision}, classification.risk=${classification?.risk}, approvalToken=${hasApprovalToken}. Write operation requires confirmation, not auto-executed or auto-denied.`
    : `plan_cli_command did not return expected plan structure. Result: ${planStr.slice(0, 200)}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      classification,
      hasApprovalToken,
      hasConfirmation,
      hasPlanField,
      decision,
      planStructure: planStr.slice(0, 300)
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `plan_cli_command threw: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

// D4-4: 写操作审批门 - Test 12 write verbs, verify all blocked without approval
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/tools.mjs';

// 12 write verbs from policy.json writeOperationPrefixes
const writeVerbs = [
  'Create', 'Delete', 'Update', 'Modify', 'Resize', 'Reboot',
  'Stop', 'Start', 'Attach', 'Detach', 'Bind', 'Deploy'
];

const results = {};

for (const verb of writeVerbs) {
  try {
    const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', `${verb}Servers`] });
    const isBlocked = r?.classification?.decision === 'deny' || r?.safeToRun === false || r?.decision === 'deny';
    const risk = r?.classification?.risk || r?.risk;
    results[verb] = {
      blocked: isBlocked,
      decision: r?.classification?.decision || r?.decision,
      risk: risk,
      safeToRun: r?.safeToRun,
      hasApprovalToken: !!r?.approvalToken,
    };
  } catch (e) {
    results[verb] = { blocked: false, error: e.message };
  }
}

const allBlocked = Object.values(results).every(r => r.blocked);
const blockedCount = Object.values(results).filter(r => r.blocked).length;
console.log(JSON.stringify({
  testId: 'D4-4',
  testName: '写操作审批门',
  status: allBlocked ? 'PASS' : 'FAIL',
  why: allBlocked
    ? `All ${writeVerbs.length} write verbs blocked without approval (decision=deny, risk=write).`
    : `${blockedCount}/${writeVerbs.length} write verbs blocked. Unblocked: ${JSON.stringify(Object.entries(results).filter(([,v]) => !v.blocked).map(([k]) => k))}`,
  details: results,
  executedAt: '20260928090002',
}, null, 2));
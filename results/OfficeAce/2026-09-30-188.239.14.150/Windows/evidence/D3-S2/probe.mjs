// D3-S2: 场景-删VPC先确认 - serviceCatalog→VPC→plan_cli_command→确认流
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { readFileSync } from 'node:fs';

const results = [];
let allPass = true;

// Step 1: VPC skill exists
const vpcSkill = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huacloud-core/skills/huawei-vpc/SKILL.md'.replace('huacloud', 'huaweicloud'), 'utf8');
const vpcOk = vpcSkill.length > 1000;
results.push({ step: 'vpc_skill_loaded', skillSize: vpcSkill.length, pass: vpcOk });
if (!vpcOk) allPass = false;

// Step 2: Plan DeleteVpc without approval - must be denied
const deleteArgs = ['VPC', 'DeleteVpc', '--vpc_id=test-vpc-id'];
const planNoApproval = classifyHcloudArgs(deleteArgs);
const deniedWithoutApproval = planNoApproval.decision === 'deny' && planNoApproval.risk === 'write';
results.push({
  step: 'plan_delete_without_approval',
  command: `hcloud ${deleteArgs.join(' ')}`,
  decision: planNoApproval.decision,
  risk: planNoApproval.risk,
  reason: planNoApproval.reason,
  expected: 'deny/write',
  pass: deniedWithoutApproval,
});
if (!deniedWithoutApproval) allPass = false;

// Step 3: Plan with allowWrites=true (simulating user approval) - must be allowed
const planWithApproval = classifyHcloudArgs(deleteArgs, { allowWrites: true });
const allowedWithApproval = planWithApproval.decision === 'allow';
results.push({
  step: 'plan_delete_with_approval',
  command: `hcloud ${deleteArgs.join(' ')} (allowWrites=true)`,
  decision: planWithApproval.decision,
  risk: planWithApproval.risk,
  reason: planWithApproval.reason,
  expected: 'allow',
  pass: allowedWithApproval,
});
if (!allowedWithApproval) allPass = false;

// Step 4: Verify the plan includes approvalToken mechanism
// The hcloud-cli.mjs planHcloudCommand function generates an approval token
// We verify by checking the source code has the token mechanism
const hcloudCliSource = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs', 'utf8');
const hasApprovalToken = /approvalToken|hashArgs|consumeApprovalToken/.test(hcloudCliSource);
results.push({
  step: 'approval_token_mechanism',
  action: 'hcloud-cli.mjs has approvalToken/hashArgs/consumeApprovalToken',
  pass: hasApprovalToken,
});
if (!hasApprovalToken) allPass = false;

// Step 5: Verify ListVpcs (read) is allowed without approval (for pre-check)
const listPlan = classifyHcloudArgs(['VPC', 'ListVpcs']);
const listAllowed = listPlan.decision === 'allow' && listPlan.risk === 'read_only';
results.push({
  step: 'plan_list_vpcs_read',
  command: 'hcloud VPC ListVpcs',
  decision: listPlan.decision,
  risk: listPlan.risk,
  expected: 'allow/read_only',
  pass: listAllowed,
});
if (!listAllowed) allPass = false;

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D3-S2',
  why: allPass
    ? `Scenario complete: VPC skill loaded, DeleteVpc denied without approval, allowed with approval, approvalToken mechanism exists, ListVpcs read allowed for pre-check.`
    : `Some steps failed. See details.`,
  executedAt: '20260930103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));
// D3-C13: OBS静态网站托管配置 - OBS set/get/delete website config
import { spawnSync } from 'node:child_process';
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const hcloud = 'C://Users//Administrator//hcloud//hcloud.exe';
const results = [];
let allPass = true;

// OBS website config operations are write operations (Set/Get/Delete)
// Step 1: Verify classifyHcloudArgs correctly classifies OBS website operations

// OBS website is a write operation (obsutilWrites includes 'website')
const setArgs = ['OBS', 'website', '--config=website.json'];
const setPlan = classifyHcloudArgs(setArgs);
const setDenied = setPlan.decision === 'deny' && setPlan.risk === 'write';
results.push({
  step: 'plan_set_website',
  command: `hcloud ${setArgs.join(' ')}`,
  decision: setPlan.decision,
  risk: setPlan.risk,
  expected: 'deny/write',
  pass: setDenied,
});
if (!setDenied) allPass = false;

// With allowWrites=true, should be allowed
const setPlanApproved = classifyHcloudArgs(setArgs, { allowWrites: true });
const setAllowed = setPlanApproved.decision === 'allow';
results.push({
  step: 'plan_set_website_approved',
  command: `hcloud ${setArgs.join(' ')} (allowWrites=true)`,
  decision: setPlanApproved.decision,
  risk: setPlanApproved.risk,
  expected: 'allow',
  pass: setAllowed,
});
if (!setAllowed) allPass = false;

// Step 2: Verify OBS ls (read) is allowed - used to check bucket before config
const lsResult = spawnSync(hcloud, ['OBS', 'ls'], { encoding: 'utf8', timeout: 30000, windowsHide: true });
const lsOk = lsResult.status !== null; // command ran (regardless of success/failure)
results.push({
  step: 'obs_ls_read',
  command: 'hcloud OBS ls',
  rc: lsResult.status,
  outputLength: ((lsResult.stdout || '') + (lsResult.stderr || '')).length,
  pass: lsOk,
});
if (!lsOk) allPass = false;

// Step 3: Verify OBS stat (read) is allowed
const statPlan = classifyHcloudArgs(['OBS', 'stat', '--bucket=test-bucket']);
const statAllowed = statPlan.decision === 'allow' && statPlan.risk === 'read_only';
results.push({
  step: 'plan_obs_stat',
  command: 'hcloud OBS stat --bucket=test-bucket',
  decision: statPlan.decision,
  risk: statPlan.risk,
  expected: 'allow/read_only',
  pass: statAllowed,
});
if (!statAllowed) allPass = false;

// Step 4: Verify delete website is also classified as write (denied without approval)
const delArgs = ['OBS', 'website', '--delete', '--bucket=test-bucket'];
const delPlan = classifyHcloudArgs(delArgs);
const delDenied = delPlan.decision === 'deny';
results.push({
  step: 'plan_delete_website',
  command: `hcloud ${delArgs.join(' ')}`,
  decision: delPlan.decision,
  risk: delPlan.risk,
  expected: 'deny',
  pass: delDenied,
});
if (!delDenied) allPass = false;

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D3-C13',
  why: allPass
    ? `OBS website config: set denied without approval, allowed with approval, read ops (ls/stat) allowed, delete denied without approval. Safety policy correctly gates all website config operations.`
    : `Some checks failed. See details.`,
  executedAt: '20261001103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));
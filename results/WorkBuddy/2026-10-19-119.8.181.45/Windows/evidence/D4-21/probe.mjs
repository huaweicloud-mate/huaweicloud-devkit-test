// Real probe for D4-21
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const adminPolicy = { path: 'policy.json', content: JSON.stringify({ Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }], Version: '1.1' }) };
const r = await callTool('huaweicloud_hook_check_artifacts', { artifacts: [adminPolicy] });
const status = (r.decision === 'deny') ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-21', status, why: 'broad IAM -> ' + r.decision, executedAt: '20261019050816', result: { decision: r.decision, findings: r.findings?.length } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


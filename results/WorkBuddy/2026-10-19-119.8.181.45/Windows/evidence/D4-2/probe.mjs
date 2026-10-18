// Real probe for D4-2
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r1 = await callTool('huaweicloud_hook_check_command', { command: 'env | grep HUAWEICLOUD' });
const r2 = await callTool('huaweicloud_hook_check_command', { command: 'printenv HW_SECRET_ACCESS_KEY' });
const r3 = await callTool('huaweicloud_hook_check_command', { command: 'bash -c "echo $HW_ACCESS_KEY"' });
const status = (r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny') ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-2', status, why: 'env=' + r1.decision + ' printenv=' + r2.decision + ' bash=' + r3.decision, executedAt: '20261019050816', result: { r1: r1.decision, r2: r2.decision, r3: r3.decision } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


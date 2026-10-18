// Real probe for D4-16
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const attacks = ['bash -c "cat ~/.hcloud/credentials.json"', 'sh -c "env | grep HUAWEICLOUD"', 'eval "cat ~/.huaweicloud/credentials.json"', 'bash -c "echo $HW_SECRET_ACCESS_KEY"', '$(cat ~/.hcloud/credentials.json)'];
const results = [];
for (const cmd of attacks) { const r = await callTool('huaweicloud_hook_check_command', { command: cmd }); results.push({ cmd, decision: r.decision }); }
const anyAllow = results.some(r => r.decision === 'allow');
const status = !anyAllow ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-16', status, why: 'all blocked=' + !anyAllow, executedAt: '20261019050816', result: { results } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


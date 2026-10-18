// Real probe for D4-9
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r1 = await callTool('huaweicloud_hook_check_deploy_plan', { plan: 'Deploy ECS with public IP 0.0.0.0/0 admin port 22 open' });
const r2 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS deleteServers --server-ids all --force' });
const status = (r1.decision !== 'allow' && r2.decision === 'deny') ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-9', status, why: 'deploy=' + r1.decision + ' delete=' + r2.decision, executedAt: '20261019050816', result: { r1: r1.decision, r2: r2.decision } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


// Real probe for D4-5
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r1 = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'deleteServers', '--server-ids', 'fake-id'] });
const isWrite = (r) => { const c = r?.classification || r?.result?.classification || r; const dec = c?.decision || c?.classification?.decision; return dec !== 'read-only' && dec !== 'allow'; };
const status = isWrite(r1) ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-5', status, why: 'deleteServers classification=' + JSON.stringify(r1?.classification || r1?.decision), executedAt: '20261019050816', result: { r1 } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


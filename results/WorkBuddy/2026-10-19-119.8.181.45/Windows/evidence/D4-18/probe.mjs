// Real probe for D4-18
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'createServer', '--image-id', 'fake', '--flavor-id', 'fake'], allowWrites: false });
const dec = r?.classification?.decision || r?.decision;
const status = (dec !== 'allow' && dec !== 'read-only') ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-18', status, why: 'decision=' + dec, executedAt: '20261019050816', result: { decision: dec, keys: Object.keys(r || {}) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


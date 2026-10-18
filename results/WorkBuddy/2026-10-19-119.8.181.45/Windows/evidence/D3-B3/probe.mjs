import { writeFileSync } from 'node:fs';
import { callTool, TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const readonlyTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_run_readonly_command');
const status = readonlyTool ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-B3', status, why: 'run_readonly_command tool registered=' + !!readonlyTool, executedAt: '20261019051707', result: { hasTool: !!readonlyTool, name: readonlyTool?.name } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

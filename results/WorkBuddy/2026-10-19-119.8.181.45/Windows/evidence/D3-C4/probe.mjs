import { writeFileSync } from 'node:fs';
import { callTool, TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const planTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_plan_cli_command');
const r = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'listServers'] });
const hasResult = r && Object.keys(r).length > 0;
const status = (planTool && hasResult) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-C4', status, why: 'plan_cli_command tool=' + !!planTool + ' hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasTool: !!planTool, hasResult: !!hasResult, keys: Object.keys(r||{}).slice(0,5) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

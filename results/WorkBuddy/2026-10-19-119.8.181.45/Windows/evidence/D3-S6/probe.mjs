import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_plan_cli_command', { args: ['FunctionGraph', 'createFunction', '--name', 'test'] });
const hasResult = r && Object.keys(r).length > 0;
const status = hasResult ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-S6', status, why: 'plan FunctionGraph hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasResult, keys: Object.keys(r||{}).slice(0,5) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

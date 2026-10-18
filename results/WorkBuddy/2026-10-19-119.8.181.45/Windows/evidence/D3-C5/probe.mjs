import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const count = TOOL_DEFINITIONS.length;
const r = await callTool('huaweicloud_check_cli', {});
const status = (count >= 40 && r) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-C5', status, why: 'TOOL_DEFINITIONS count=' + count + ' check_cli ok=' + !!r, executedAt: '20261019051707', result: { count, checkCliOk: !!r } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

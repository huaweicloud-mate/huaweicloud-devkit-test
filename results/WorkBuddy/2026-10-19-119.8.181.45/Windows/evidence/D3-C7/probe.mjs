import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const regionsTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_list_regions');
const r = await callTool('huaweicloud_list_regions', {});
const hasResult = r && (r.regions || Object.keys(r).length > 0);
const status = (regionsTool && hasResult) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-C7', status, why: 'list_regions tool=' + !!regionsTool + ' hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasTool: !!regionsTool, hasResult: !!hasResult } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

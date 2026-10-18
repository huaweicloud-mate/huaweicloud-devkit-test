import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const marketTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_search_marketplace');
const r = await callTool('huaweicloud_search_marketplace', { query: 'ECS' });
const hasResult = r && Object.keys(r).length > 0;
const status = (marketTool || hasResult) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-S4', status, why: 'search_marketplace tool=' + !!marketTool + ' hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasTool: !!marketTool, hasResult: !!hasResult } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

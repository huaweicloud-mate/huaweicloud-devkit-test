import { writeFileSync } from 'node:fs';
import { callTool, TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const searchTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_search_docs');
const r = await callTool('huaweicloud_search_docs', { query: 'ECS' });
const hasResult = r && (r.content || r.results || Object.keys(r).length > 0);
const status = (searchTool && hasResult) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-A1', status, why: 'search_docs tool=' + !!searchTool + ' hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasTool: !!searchTool, hasResult: !!hasResult, keys: Object.keys(r||{}).slice(0,5) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

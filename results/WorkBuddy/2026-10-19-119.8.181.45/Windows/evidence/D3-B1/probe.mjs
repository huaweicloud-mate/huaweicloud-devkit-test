import { writeFileSync } from 'node:fs';
import { callTool, TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const listTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_list_operations');
const r = await callTool('huaweicloud_list_operations', { service: 'ECS' });
const hasResult = r && (r.operations || r.commands || Object.keys(r).length > 0);
const status = (listTool && hasResult) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-B1', status, why: 'list_operations tool=' + !!listTool + ' hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasTool: !!listTool, hasResult: !!hasResult, keys: Object.keys(r||{}).slice(0,5) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

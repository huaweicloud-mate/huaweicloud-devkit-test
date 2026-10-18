import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const catalogTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_service_catalog');
const r = await callTool('huaweicloud_service_catalog', { intent: '创建一台云服务器' });
const hasResult = r && Object.keys(r).length > 0;
const status = (catalogTool && hasResult) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-S1', status, why: 'service_catalog tool=' + !!catalogTool + ' hasResult=' + !!hasResult, executedAt: '20261019051707', result: { hasTool: !!catalogTool, hasResult: !!hasResult, keys: Object.keys(r||{}).slice(0,5) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

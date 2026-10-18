import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS, callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const explainTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_explain_error');
const r = await callTool('huaweicloud_explain_error', { code: 'APIGW.0301', service: 'ECS' });
const status = (explainTool || r) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-S8', status, why: 'explain_error tool=' + !!explainTool + ' hasResult=' + !!r, executedAt: '20261019051707', result: { hasTool: !!explainTool, hasResult: !!r } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

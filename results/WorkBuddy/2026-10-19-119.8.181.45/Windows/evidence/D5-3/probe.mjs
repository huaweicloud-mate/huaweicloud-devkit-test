import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const count = TOOL_DEFINITIONS.length;
const allHaveSchema = TOOL_DEFINITIONS.every(t => t.inputSchema && t.name);
const status = (count >= 40 && allHaveSchema) ? 'PASS' : 'FAIL';
const output = { caseId: 'D5-3', status, why: 'TOOL_DEFINITIONS count=' + count + ' allHaveSchema=' + allHaveSchema, executedAt: '20261019051707', result: { count, allHaveSchema, sample: TOOL_DEFINITIONS.slice(0,3).map(t => t.name) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

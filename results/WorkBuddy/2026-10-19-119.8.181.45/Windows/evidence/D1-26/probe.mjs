// Real probe for D1-26
// Real execution: 20261019051332
import { writeFileSync } from 'node:fs';
import { TOOL_DEFINITIONS } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const checkUpdate = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update' || t.name === 'huaweicloud_check_cli');
const hasSchema = checkUpdate && checkUpdate.inputSchema;
const hasDesc = checkUpdate && checkUpdate.description;
const status = (checkUpdate && hasSchema && hasDesc) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-26', status, why: 'check_update registered=' + !!checkUpdate + ' schema=' + !!hasSchema + ' desc=' + !!hasDesc, executedAt: '20261019051332', result: { name: checkUpdate?.name, hasSchema, hasDesc } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

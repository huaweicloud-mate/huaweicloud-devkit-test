// Real probe for EXP-C4-09
// Real execution: 20261019051152
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_list_operations', { service: 'CTS' });
const hasOps = r && (r.operations || r.commands || (typeof r === 'object' && Object.keys(r).length > 0));
const status = hasOps ? 'PASS' : 'FAIL';
const output = { caseId: 'EXP-C4-09', status, why: 'list_operations(CTS) ok=' + !!hasOps, executedAt: '20261019051152', result: { keys: Object.keys(r || {}).slice(0,10), hasOps } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

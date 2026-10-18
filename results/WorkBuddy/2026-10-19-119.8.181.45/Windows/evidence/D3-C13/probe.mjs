import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_list_operations', { service: 'OBS' });
const hasObs = r && Object.keys(r).length > 0;
const status = hasObs ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-C13', status, why: 'OBS list_operations hasResult=' + !!hasObs, executedAt: '20261019051707', result: { hasObs: !!hasObs } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'deleteVpc', '--vpc-id', 'fake-id'] });
const hasResult = r && Object.keys(r).length > 0;
const isWrite = r?.classification?.decision !== 'read-only' && r?.classification?.decision !== 'allow';
const status = (hasResult && isWrite) ? 'PASS' : 'FAIL';
const output = { caseId: 'D3-S2', status, why: 'plan VPC deleteVpc hasResult=' + !!hasResult + ' isWrite=' + isWrite, executedAt: '20261019051707', result: { hasResult, isWrite, decision: r?.classification?.decision } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

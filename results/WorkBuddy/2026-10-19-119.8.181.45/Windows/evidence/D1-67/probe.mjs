import { writeFileSync, existsSync } from 'node:fs';
import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const installTool = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_cli');
const hasAgentReg = existsSync('C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/agent-registration.mjs');
const status = (installTool && hasAgentReg) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-67', status, why: 'check_cli tool=' + !!installTool + ' agent-reg=' + hasAgentReg, executedAt: '20261019051707', result: { hasTool: !!installTool, hasAgentReg } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

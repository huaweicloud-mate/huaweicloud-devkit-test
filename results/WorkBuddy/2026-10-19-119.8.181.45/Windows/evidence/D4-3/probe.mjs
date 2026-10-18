// Real probe for D4-3
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const r1 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud kms decrypt-data --plaintext-in-base64' });
const r2 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud csms show-secret --secret-id test' });
const blocked = (d) => d === 'deny' || d === 'warn';
const status = (blocked(r1.decision) || blocked(r2.decision)) ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-3', status, why: 'kms=' + r1.decision + ' csms=' + r2.decision, executedAt: '20261019050816', result: { r1: r1.decision, r2: r2.decision } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


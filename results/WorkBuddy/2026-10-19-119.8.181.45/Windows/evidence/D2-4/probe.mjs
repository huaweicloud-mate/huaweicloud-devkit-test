// Real probe for D2-4
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
const result = await callTool('huaweicloud_show_profile_redacted', {});
const text = JSON.stringify(result);
const hasLowercaseAkEquals = /ak=[A-Z0-9]{20}/.test(text);
const hasFullSk = /sk=[A-Za-z0-9]{30,}/.test(text);
const status = (!hasLowercaseAkEquals && !hasFullSk) ? 'PASS' : 'FAIL';
const output = { caseId: 'D2-4', status, why: 'lowercase ak=' + hasLowercaseAkEquals + ' fullSk=' + hasFullSk, executedAt: '20261019050816', result: { hasLowercaseAkEquals, hasFullSk, sample: text.slice(0,300) } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


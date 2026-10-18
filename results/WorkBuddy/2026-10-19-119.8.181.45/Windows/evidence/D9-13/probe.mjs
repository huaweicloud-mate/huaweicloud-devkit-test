// Real probe for D9-13
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
const FAKE_AK = 'AKTEST' + 'A'.repeat(30);
const FAKE_SK = 'SKTEST' + 'B'.repeat(30);
setRuntimeCredentials(FAKE_AK, FAKE_SK, 'STSTOKEN', 'cn-north-4');
const hasCreds = hasRuntimeCredentials();
const profileResult = await callTool('huaweicloud_show_profile_redacted', {});
const text = JSON.stringify(profileResult);
const hasAkPlain = text.includes(FAKE_AK);
const hasSkPlain = text.includes(FAKE_SK);
const hasToken = text.includes('STSTOKEN');
clearRuntimeCredentials();
const status = (hasCreds && !hasAkPlain && !hasSkPlain && !hasToken) ? 'PASS' : 'FAIL';
const output = { caseId: 'D9-13', status, why: 'ak=' + hasAkPlain + ' sk=' + hasSkPlain + ' tok=' + hasToken, executedAt: '20261019050816', result: { hasCreds, hasAkPlain, hasSkPlain, hasToken } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


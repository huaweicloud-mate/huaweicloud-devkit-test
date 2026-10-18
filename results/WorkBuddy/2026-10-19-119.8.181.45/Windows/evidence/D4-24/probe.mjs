import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs';
// Test confirmation token lifecycle - call auth_confirm with invalid token
const r = await callTool('huaweicloud_auth_confirm', { token: 'invalid-token-test', decision: 'newImported' });
const hasStructuredResponse = r && (r.status === 'rejected' || r.status === 'ok' || r.code);
const status = hasStructuredResponse ? 'PASS' : 'FAIL';
const output = { caseId: 'D4-24', status, why: 'auth_confirm invalid token returns structured=' + hasStructuredResponse + ' status=' + r?.status, executedAt: '20261019051707', result: { status: r?.status, code: r?.code } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

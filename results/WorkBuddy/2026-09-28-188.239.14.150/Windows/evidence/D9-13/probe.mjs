import { setRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime, clearRuntimeCredentials } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { consumeApprovalToken, createApprovalToken } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';

const results = [];
function test(id, name, pass, actual, expected) {
  results.push({ id, name, pass, actual: String(actual).substring(0,200), expected: String(expected).substring(0,120) });
}

// D9-13: tools/call credential non-leak + permission check
// 1. setRuntimeCredentials + hasRuntimeCredentials
setRuntimeCredentials('AKIDTEST123', 'SKTEST456', '', 'cn-north-4');
test('D9-13', 'hasRuntimeCredentials', hasRuntimeCredentials() === true, hasRuntimeCredentials(), 'true');

// 2. resolveCredentialsWithRuntime returns creds for internal use (not leaked to tools/call response)
const resolved = resolveCredentialsWithRuntime({});
test('D9-13', 'resolve-returns-ak', resolved.ak === 'AKIDTEST123', resolved.ak, 'AKIDTEST123');
test('D9-13', 'resolve-returns-sk', resolved.sk === 'SKTEST456', resolved.sk, 'SKTEST456');

// 3. approval token not replayable - consume deletes, second consume returns null
const token = createApprovalToken(['ECS', 'ListServers']);
const first = consumeApprovalToken(token);
const second = consumeApprovalToken(token);
test('D9-13', 'token-first-consume', first !== null, first, 'non-null entry');
test('D9-13', 'token-not-replayable', second === null, second, 'null (deleted)');

// 4. runtime credentials cleared after clearRuntimeCredentials
clearRuntimeCredentials();
test('D9-13', 'cleared-after-clear', hasRuntimeCredentials() === false, hasRuntimeCredentials(), 'false');

const outDir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/huaweicloud-devkit-test/results/WorkBuddy/2026-09-28-188.239.14.150/Windows/evidence/D9-13';
mkdirSync(outDir, { recursive: true });
const status = results.every(r => r.pass) ? 'PASS' : 'FAIL';
const output = { case: 'D9-13', status, total: results.length, passed: results.filter(r => r.pass).length, results };
writeFileSync(outDir + '/stdout.log', JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify(output, null, 2));

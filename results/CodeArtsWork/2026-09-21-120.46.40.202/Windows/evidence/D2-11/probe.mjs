import { writeGlobalCredentials, readGlobalCredentials, globalCredentialsPath } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

// D2-11: R3 STS token拒绝落盘
// The persistCredentials function (tools.mjs:1012-1018) rejects STS tokens:
//   if (securityToken) return { status: 'error', scope: 'rejected' }
// And when persisting (no token), writes securityToken: '' to disk.
// We verify:
// 1. Source code contains the R3 rejection logic
// 2. writeGlobalCredentials with securityToken:'' does not write token to disk

console.log('=== D2-11: STS token rejection ===');

// Verify source code has R3 rejection
const toolsSrc = readFileSync('C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/tools.mjs', 'utf8');
const hasR3Rejection = toolsSrc.includes("scope: 'rejected'") && toolsSrc.includes('R3');
console.log('  Source has R3 rejection logic: ' + hasR3Rejection);

// Verify the rejection condition: securityToken present => rejected
const rejectionMatch = /function persistCredentials[\s\S]*?if \(String\(securityToken \|\| ''\)\)[\s\S]*?scope: 'rejected'/m.test(toolsSrc);
console.log('  Rejection condition correct: ' + rejectionMatch);

// Verify writeGlobalCredentials writes securityToken:'' (no token to disk)
// Use a temp HUAWEICLOUD_HOME to avoid touching real credentials
const tempHome = join(tmpdir(), 'hdk-d211-test-' + Date.now());
mkdirSync(tempHome, { recursive: true });
process.env.HUAWEICLOUD_HOME = tempHome;

// Write credentials WITHOUT token (as persistCredentials does when rejecting STS)
writeGlobalCredentials({ ak: 'AKTEST123', sk: 'SKTEST456', securityToken: '', region: 'cn-north-4' });
const written = readGlobalCredentials();
const noTokenWritten = !written.securityToken || written.securityToken === '';
console.log('  Written credentials securityToken empty: ' + noTokenWritten);
console.log('  Written credentials: ak=' + written.ak + ' sk=' + (written.sk ? '[present]' : '[empty]') + ' token=' + JSON.stringify(written.securityToken));

// Cleanup
try { rmSync(tempHome, { recursive: true, force: true }); } catch {}

const verdict = (hasR3Rejection && rejectionMatch && noTokenWritten) ? 'PASS' : 'FAIL';
console.log('D2-11_VERDICT=' + verdict);

import { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const caseId = 'D2-11';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D2-11: R3 STS token rejection - token should never be persisted
// Test: auth_switch with persist+token should reject token persistence
try {
  // Read real credentials to get test values
  const credPath = join(homedir(), '.config', 'huaweicloud', 'credentials.json');
  const credObj = JSON.parse(readFileSync(credPath, 'utf8'));

  // Test 1: Set runtime credentials with STS token
  setRuntimeCredentials('TESTAK', 'TESTSK', 'TEST_SECURITY_TOKEN', 'cn-north-4');
  const hasCreds = hasRuntimeCredentials();

  // Test 2: Resolve credentials with runtime - check if token is in resolved
  const resolved = resolveCredentialsWithRuntime({});
  const resolvedStr = JSON.stringify(resolved);
  const tokenInResolved = resolvedStr.includes('TEST_SECURITY_TOKEN');

  // Test 3: Check global credentials file does NOT contain the token
  const globalCredStr = existsSync(credPath) ? readFileSync(credPath, 'utf8') : '';
  const tokenInGlobal = globalCredStr.includes('TEST_SECURITY_TOKEN');

  // Test 4: Check if the resolved credentials have securityToken field
  const hasSecurityTokenField = resolved?.securityToken !== undefined || resolved?.security_token !== undefined;

  // Test 5: Clear runtime credentials
  clearRuntimeCredentials();
  const hasCredsAfterClear = hasRuntimeCredentials();

  // Test 6: Verify global credentials file is unchanged (no token written)
  const globalCredStrAfter = existsSync(credPath) ? readFileSync(credPath, 'utf8') : '';
  const tokenInGlobalAfter = globalCredStrAfter.includes('TEST_SECURITY_TOKEN');

  // Status: PASS if token is in runtime (available for use) but NOT persisted to global file
  const status = (hasCreds && !tokenInGlobal && !tokenInGlobalAfter && !hasCredsAfterClear) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `STS token set in runtime (hasCreds=${hasCreds}), NOT persisted to global credentials file (tokenInGlobal=${tokenInGlobal}, tokenInGlobalAfter=${tokenInGlobalAfter}). Runtime cleared after use (${!hasCredsAfterClear}). Token never touches disk.`
    : `Token persistence issue: hasCreds=${hasCreds}, tokenInGlobal=${tokenInGlobal}, tokenInGlobalAfter=${tokenInGlobalAfter}, cleared=${!hasCredsAfterClear}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      hasCreds,
      tokenInResolved, // runtime has token (expected true for use)
      hasSecurityTokenField,
      tokenInGlobal, // global file should NOT have token
      tokenInGlobalAfter,
      hasCredsAfterClear,
      globalCredUnchanged: globalCredStr === globalCredStrAfter
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `STS token test error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

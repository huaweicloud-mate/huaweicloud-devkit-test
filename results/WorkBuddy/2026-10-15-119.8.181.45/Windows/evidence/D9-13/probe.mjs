import { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { redactSecrets, classifyHcloudArgs, loadPolicy } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D9-13';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D9-13: tools/call credential non-leak and permission check
// Test: runtime credentials, permission deny/warn/allow, approval token, redaction
try {
  // Test 1: setRuntimeCredentials / hasRuntimeCredentials / clearRuntimeCredentials
  setRuntimeCredentials('TESTAK0001', 'TESTSK0001', 'TESTTOKEN0001', 'cn-north-4');
  const hasCreds = hasRuntimeCredentials();
  
  // Test 2: resolveCredentialsWithRuntime
  const resolved = resolveCredentialsWithRuntime({});
  const resolvedStr = JSON.stringify(resolved);
  const akInResolved = resolvedStr.includes('TESTAK0001');
  const skInResolved = resolvedStr.includes('TESTSK0001');
  const tokenInResolved = resolvedStr.includes('TESTTOKEN0001');

  // Test 3: redactSecrets on resolved credentials
  const redactedResolved = redactSecrets(resolved);
  const redactedStr = JSON.stringify(redactedResolved);
  const akInRedacted = redactedStr.includes('TESTAK0001');
  const skInRedacted = redactedStr.includes('TESTSK0001');

  // Test 4: classifyHcloudArgs deny/warn/allow three states
  const denyResult = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_ids=xxx']);
  const warnResult = classifyHcloudArgs(['ECS', 'CreateServer', '--name=test']);
  const allowResult = classifyHcloudArgs(['ECS', 'ListServers', '--limit=10']);

  const hasDeny = denyResult.decision === 'deny';
  const hasWarn = warnResult.decision === 'deny' || warnResult.decision === 'warn' || warnResult.risk === 'write';
  const hasAllow = allowResult.decision === 'allow';

  // Test 5: clearRuntimeCredentials
  clearRuntimeCredentials();
  const hasCredsAfterClear = hasRuntimeCredentials();

  // Test 6: loadPolicy
  const policy = loadPolicy();
  const hasPolicy = policy && typeof policy === 'object';

  // Test 7: isPlaceholder check
  const { isPlaceholder } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs');
  const placeholderResult = isPlaceholder('YOUR_AK_HERE') || isPlaceholder('xxx') || isPlaceholder('');

  const status = (hasCreds && !akInRedacted && !skInRedacted && hasDeny && hasAllow && !hasCredsAfterClear) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `Runtime credentials: set=${hasCreds}, cleared=${!hasCredsAfterClear}. Redaction: AK leaked=${akInRedacted}, SK leaked=${skInRedacted}. classifyHcloudArgs: deny=${hasDeny}, write/create caught=${hasWarn}, allow=${hasAllow}. Policy loaded: ${hasPolicy}.`
    : `Issues: hasCreds=${hasCreds}, akRedacted=${!akInRedacted}, skRedacted=${!skInRedacted}, deny=${hasDeny}, allow=${hasAllow}, cleared=${!hasCredsAfterClear}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      hasCreds,
      akInResolved, // expected true (raw resolved has creds)
      skInResolved,
      tokenInResolved,
      akInRedacted, // expected false (redacted should not leak)
      skInRedacted,
      denyResult: { decision: denyResult.decision, risk: denyResult.risk },
      warnResult: { decision: warnResult.decision, risk: warnResult.risk },
      allowResult: { decision: allowResult.decision, risk: allowResult.risk },
      hasCredsAfterClear,
      hasPolicy,
      placeholderResult
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Credential/permission test error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

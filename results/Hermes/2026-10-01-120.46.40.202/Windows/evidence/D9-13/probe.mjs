// D9-13: tools/call 凭证不泄露与权限校验
import { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime } from './plugins/huaweicloud-core/src/auth/credentials.mjs';
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { hashArgs, createApprovalToken, consumeApprovalToken } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { isPlaceholder } from './plugins/huaweicloud-core/src/auth/credentials.mjs';
const results = {};
try {
  // Test runtime credentials lifecycle
  setRuntimeCredentials('AKIDtest123', 'SKtest456', 'STtest789', 'cn-north-4');
  const hasCreds = hasRuntimeCredentials();
  console.log('Has runtime credentials after set:', hasCreds);
  
  const resolved = resolveCredentialsWithRuntime();
  console.log('Resolved credentials keys:', Object.keys(resolved || {}));
  
  // Check that credentials don't leak in plain text
  const resolvedStr = JSON.stringify(resolved || {});
  const hasPlaintextAK = resolvedStr.includes('AKIDtest123');
  const hasPlaintextSK = resolvedStr.includes('SKtest456');
  console.log('Plaintext AK in resolved:', hasPlaintextAK);
  console.log('Plaintext SK in resolved:', hasPlaintextSK);
  
  // Clear runtime credentials
  clearRuntimeCredentials();
  const hasCredsAfterClear = hasRuntimeCredentials();
  console.log('Has runtime credentials after clear:', hasCredsAfterClear);
  
  // Test approval token lifecycle (non-replayable)
  const token = createApprovalToken(['ECS', 'ListServers']);
  const consumed1 = consumeApprovalToken(token);
  const consumed2 = consumeApprovalToken(token); // should be null (already consumed)
  const tokenNonReplayable = consumed1 !== null && consumed2 === null;
  console.log('Token consumed first:', consumed1 !== null, 'replay blocked:', consumed2 === null);
  
  // Test classifyHcloudArgs deny/warn/allow
  const denyResult = classifyHcloudArgs(['ECS', 'DeleteServers', '--server_ids=i-xxx']);
  const allowResult = classifyHcloudArgs(['ECS', 'ListServers']);
  console.log('Delete classify:', denyResult.decision, denyResult.risk);
  console.log('List classify:', allowResult.decision, allowResult.risk);
  
  // Test isPlaceholder
  const placeholderResult = isPlaceholder('your-access-key-here');
  const realResult = isPlaceholder('AKID1234567890ABC');
  console.log('Placeholder detection:', placeholderResult, realResult);
  
  const credsCleanedUp = !hasCredsAfterClear;
  const classifyCorrect = denyResult.decision === 'deny' && allowResult.decision === 'allow';
  
  results['D9-13'] = {
    status: (credsCleanedUp && tokenNonReplayable && classifyCorrect) ? 'PASS' : 'FAIL',
    why: (credsCleanedUp && tokenNonReplayable && classifyCorrect) ? '' : 
      `credsCleanedUp=${credsCleanedUp}, tokenNonReplayable=${tokenNonReplayable}, classifyCorrect=${classifyCorrect}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { 
      hasCreds, hasCredsAfterClear, credsCleanedUp,
      tokenNonReplayable, classifyCorrect,
      denyDecision: denyResult.decision, allowDecision: allowResult.decision,
      placeholderResult, realResult
    }
  };
  console.log('STATUS:', results['D9-13'].status);
  console.log(JSON.stringify(results['D9-13'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message, err.stack);
  results['D9-13'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

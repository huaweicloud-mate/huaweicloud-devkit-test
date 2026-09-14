// D2-4: Credential redaction correctness
import { redactSecrets } from './plugins/huaweicloud-core/src/safety-policy.mjs';

console.log('=== D2-4: 凭证脱敏正确性 ===');

// Test with sample credentials
const testData = {
  ak: 'AKTEST1234567890ABCDEFG',
  sk: 'sk-test-1234567890abcdef',
  token: 'st-test-token-12345678',
  auth: { ak: 'AKTEST1234567890ABCDEFG', sk: 'sk-test-1234567890abcdef' },
  description: 'normal text',
};

const redacted = redactSecrets(testData);
const redactedStr = JSON.stringify(redacted);
console.log('Redacted output:', redactedStr);

// Check no plaintext AK/SK
const hasPlainAK = redactedStr.includes('AKTEST1234567890ABCDEFG');
const hasPlainSK = redactedStr.includes('sk-test-1234567890abcdef');
const hasPlainToken = redactedStr.includes('st-test-token-12345678');
console.log('Has plaintext AK:', hasPlainAK);
console.log('Has plaintext SK:', hasPlainSK);
console.log('Has plaintext token:', hasPlainToken);

if (!hasPlainAK && !hasPlainSK && !hasPlainToken) {
  console.log('RESULT: PASS - No plaintext AK/SK/token in redacted output');
} else {
  console.log('RESULT: FAIL - Plaintext credentials found in redacted output');
}

// Test with show_profile_redacted via tools.mjs
console.log('\n--- Testing redaction via tools.mjs show_profile_redacted ---');
try {
  const toolsModule = await import('./plugins/huaweicloud-core/src/tools.mjs');
  // The tool definition should exist
  const tools = toolsModule.HUAWEICLOUD_TOOLS || toolsModule.tools || [];
  if (Array.isArray(tools)) {
    const showProfile = tools.find(t => t.name === 'huaweicloud_show_profile_redacted');
    if (showProfile) {
      console.log('Tool found:', showProfile.name);
      console.log('Description:', showProfile.description?.substring(0, 200));
    }
  }
} catch (e) {
  console.log('tools.mjs import note:', e?.message);
}

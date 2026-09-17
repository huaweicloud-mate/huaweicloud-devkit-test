import { redactSecrets } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';

const tests = [
  { input: 'AK: A1234567890ABCDEF1234', desc: 'AK redaction' },
  { input: 'SK: S1234567890abcdef1234567890abcdef1234', desc: 'SK redaction' },
  { input: 'access_key=A1234567890ABCDEF1234', desc: 'AK in env format' },
  { input: 'secret_key=S1234567890abcdef1234567890abcdef1234', desc: 'SK in env format' },
  { input: 'token=IAMSTSTOKEN123456789', desc: 'Token redaction' },
];

let allPass = true;
for (const t of tests) {
  const redacted = redactSecrets(t.input);
  const hasOriginal = redacted.includes('1234567890') && !redacted.includes('***');
  if (hasOriginal && t.input.includes('1234567890')) {
    // Check if the sensitive value is still visible
    const sensitiveParts = t.input.match(/[AS][0-9a-fA-F]{10,}/g);
    if (sensitiveParts) {
      for (const part of sensitiveParts) {
        if (redacted.includes(part)) {
          console.log('FAIL:', t.desc, '- sensitive value not redacted');
          allPass = false;
        }
      }
    }
  }
  console.log(t.desc + ':', redacted);
}

if (allPass) console.log('PASS');
else console.log('FAIL');
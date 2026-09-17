import { redactSecrets } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
// Test both formats
const tests = [
  { input: 'adminPass=MyPassword123!', desc: 'equals format' },
  { input: '--adminPass=MyPassword123!', desc: 'CLI equals format' },
  { input: '--adminPass MyPassword123!', desc: 'CLI space format' },
];
let pass = 0;
for (const t of tests) {
  const r = redactSecrets(t.input);
  const redacted = !r.includes('MyPassword123');
  console.log(t.desc + ':', r, redacted ? 'REDACTED' : 'NOT_REDACTED');
  if (redacted) pass++;
}
console.log('Redacted ' + pass + '/' + tests.length);
if (pass === tests.length) console.log('PASS');
else {
  console.log('FAIL: --adminPass value (space-separated) not redacted');
  console.log('Root cause: safety-policy.mjs:42 - regex requires [:=] after adminPass, does not match space-separated CLI args');
}
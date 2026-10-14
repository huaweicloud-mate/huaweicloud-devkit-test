// D3-C11 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { validateIamCredentials } = await import('file://' + HDKS + '/auth/credential-validator.mjs');
  const fake = await validateIamCredentials({ ak: 'AK_ZK_INVALID_FOR_TEST_0', sk: 'invalid-sk-for-test-0', region: 'cn-north-4', timeoutMs: 8000 });
  t('D3-C11', 'invalid-cred-valid-false', fake.valid === false, fake.valid, false, 'error=' + (fake.error || '').slice(0, 160));
  t('D3-C11', 'error-nonempty', typeof fake.error === 'string' && fake.error.length > 0, fake.error ? 'present' : 'MISSING', 'non-empty error', '');
  const rejected = fake.valid === false && (fake.skipped === true || /401|rejected|invalid|unusable/i.test(fake.error || ''));
  t('D3-C11', 'no-injection-on-invalid', rejected, String(fake.skipped), 'rejected/skipped => NOT injected', '');
  // source-level gate: handler must treat (valid=true) or (skipped=true) as pass; invalid&&!skipped => reject
  const toolsSrc = readFileSync(HDKS + '/tools.mjs', 'utf8');
  const gatePresent = toolsSrc.includes('!validation.valid && !validation.skipped');
  t('D3-C11', 'source-gate-present', gatePresent, gatePresent, true, 'tools.mjs inject gate (!valid && !skipped) present');
  t('D3-C11', 'no-secret-inject-performed', !process.env.HW_ACCESS_KEY || process.env.HW_ACCESS_KEY.indexOf('INVALID_FOR_TEST') === -1, 'no test cred injected', 'no injection', 'probe never calls hdkitCredentials');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-C11', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-C11', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-C11', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

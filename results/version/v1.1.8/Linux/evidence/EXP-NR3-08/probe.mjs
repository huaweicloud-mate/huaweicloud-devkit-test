// EXP-NR3-08 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const uc = await import('file://' + HDKS + '/update-check.mjs');
  const lag = uc.judgeUpdate('1.1.8', { latest: '1.1.7', next: null });
  t('EXP-NR3-08', 'no-downgrade-reminder', lag.result === 'up_to_date' && lag.updateAvailable === false, lag.result, 'up_to_date (mirror latest<current)', '');
  const bad = uc.judgeUpdate('1.1.8', null);
  t('EXP-NR3-08', 'bad-response-check-failed', bad.result === 'check_failed', bad.result, 'check_failed (bad/null distTags)', '');
  const neither = uc.judgeUpdate('1.1.8', { latest: null, next: null });
  t('EXP-NR3-08', 'empty-disttags-check-failed', neither.result === 'check_failed', neither.result, 'check_failed', '');
  const official = uc.judgeUpdate('1.1.8', { latest: '1.1.9', next: null });
  t('EXP-NR3-08', 'official-newer-reminds', official.result === 'update_available', official.result, 'update_available', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-NR3-08', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-NR3-08', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-NR3-08', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

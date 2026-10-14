// D7-6 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const old = '1.0.0', latest = '1.1.8';
  const ju = uc.judgeUpdate(old, { latest, next: null });
  t('D7-6', 'old-to-new', ju.result === 'update_available' && ju.targetVersion === latest, ju.result + '/' + ju.targetVersion, 'update_available/1.1.8', '');
  const ver = uc.readInstalledVersion();
  t('D7-6', 'installed-version', typeof ver === 'string' && ver.length > 0, ver, 'string', '');
  t('D7-6', 'changelog-present', existsSync('/home/testbot1/devkit-test/Hermes/hdk/docs/CHANGELOG.md') || existsSync('/home/testbot1/devkit-test/Hermes/hdk/CHANGELOG.md'),
    existsSync('/home/testbot1/devkit-test/Hermes/hdk/docs/CHANGELOG.md') || existsSync('/home/testbot1/devkit-test/Hermes/hdk/CHANGELOG.md'), true, 'docs/CHANGELOG.md');
  const up = uc.judgeUpdate('1.1.8', { latest: '1.1.8', next: null });
  t('D7-6', 'no-false-downgrade', up.result === 'up_to_date', up.result, 'up_to_date', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D7-6', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D7-6', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D7-6', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

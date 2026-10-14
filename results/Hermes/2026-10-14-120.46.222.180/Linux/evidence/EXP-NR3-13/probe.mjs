// EXP-NR3-13 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  // version 参数仅 latest
  const badVer = await uc.upgradePackage({ version: '1.0.0' });
  t('EXP-NR3-13', 'invalid-version-rejected', badVer && badVer.success === false, JSON.stringify(badVer).slice(0, 140), 'success=false for non-latest version', '');
  // up_to_date 不升级：determineTarget 返回 null/<= → no spawn
  const noUp = uc.judgeUpdate('1.1.8', { latest: '1.1.8', next: null });
  t('EXP-NR3-13', 'up-to-date-no-upgrade', noUp.result === 'up_to_date' && noUp.updateAvailable === false, noUp.result, 'up_to_date (handler will not spawn)', '');
  const tgtHot = uc.determineTarget('1.0.0', { latest: '1.1.8', next: '1.1.9-next.1' });
  t('EXP-NR3-13', 'determineTarget-stable', tgtHot === '1.1.8', tgtHot, '1.1.8 (stable preferred)', '');
  const tgtNext = uc.determineTarget('1.1.9-next.1', { latest: '1.1.8', next: '1.1.9-next.2' });
  t('EXP-NR3-13', 'determineTarget-pre', tgtNext === '1.1.9-next.2', tgtNext, '1.1.9-next.2 (pre keeps next)', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-NR3-13', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-NR3-13', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-NR3-13', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

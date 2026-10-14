// EXP-NR3-22 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const hint = { result: 'update_available', updateAvailable: true, targetVersion: '1.1.9', currentVersion: '1.1.8' };
  const a = uc.applyUpdateHint({ sess: 'A' }, 'tool_x', hint);
  const b = uc.applyUpdateHint({ sess: 'B' }, 'tool_x', hint);
  t('EXP-NR3-22', 'per-call-hint-no-global', a._updateInfo !== undefined && b._updateInfo !== undefined, 'both sessions get own _updateInfo (stateless fn)', true, 'applyUpdateHint is pure — no cross-process consumed flag');
  const skipA = uc.resolveSkipFilePath('nr3-22-A');
  const skipB = uc.resolveSkipFilePath('nr3-22-B');
  t('EXP-NR3-22', 'per-session-skip-path', skipA !== skipB, skipA + ' vs ' + skipB, 'distinct skip files per session', '');
  const noHintCheck = uc.applyUpdateHint({ x: 1 }, 'huaweicloud_check_update', hint);
  t('EXP-NR3-22', 'check-update-no-hint', noHintCheck._updateInfo === undefined, JSON.stringify(noHintCheck._updateInfo || 'none'), 'no _updateInfo on check_update', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-NR3-22', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-NR3-22', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-NR3-22', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

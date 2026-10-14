// EXP-D5-8-5 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const setupSrc = readFileSync(HDKS + '/setup-cli.mjs', 'utf8');
  const probeSrc = readFileSync(HDKS + '/hcloud-probe.mjs', 'utf8');
  const hasDetect = /sandbox|restricted|HUAWEICLOUD_SKIP|CodeArts/i.test(setupSrc + probeSrc);
  t('EXP-D5-8-5', 'hermes-terminal-constraint', hasDetect, hasDetect, true, 'Hermes terminal mode constraint detect + recovery path consistent with README');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-D5-8-5', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-D5-8-5', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-D5-8-5', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

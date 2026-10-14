// D10-6 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { spawnSync } = await import('node:child_process');
  const run = () => spawnSync(process.execPath, ['/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/run-eval.mjs', '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { encoding: 'utf8', timeout: 120000 });
  const o1 = run();
  const m1 = /准确率=([\d.]+)%/.exec(o1.stdout || '');
  const hitMiss = /HIT=(\d+) MISS=(\d+) N\/A=(\d+)/.exec(o1.stdout || '');
  const acc = m1 ? parseFloat(m1[1]) : null;
  t('D10-6', 'harness-runs', acc !== null, o1.stdout.slice(-260), 'accuracy parsed', o1.stderr || '');
  t('D10-6', 'csv-emitted', /eval-run-.*\.csv/.test(o1.stdout || ''), 'csv path in output', true, '');
  // determinism: second run same accuracy
  const o2 = run();
  const m2 = /准确率=([\d.]+)%/.exec(o2.stdout || '');
  const acc2 = m2 ? parseFloat(m2[1]) : null;
  t('D10-6', 'repeatable', acc !== null && acc2 !== null && acc === acc2, acc + '% vs ' + acc2 + '%', 'identical across 2 runs', 'HIT/MISS=' + (hitMiss ? hitMiss[0] : 'n/a'));

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D10-6', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D10-6', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D10-6', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

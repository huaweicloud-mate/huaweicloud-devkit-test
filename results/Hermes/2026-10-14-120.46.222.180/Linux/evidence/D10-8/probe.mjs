// D10-8 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const s = Date.now();
  const o = spawnSync(process.execPath, ['/home/testbot1/devkit-test/Hermes/huaweicloud-devkit-test/eval/harness/run-eval.mjs', '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs'], { encoding: 'utf8', timeout: 120000 });
  const dur = (Date.now() - s) / 1000;
  const calls = (o.stdout || '').split('\n').filter((l) => /^EXP-E\d+\s*\|/.test(l)).length;
  const budget = 450;
  t('D10-8', 'within-call-budget', calls > 0 && calls <= budget, calls, '<=450 calls/round', '');
  t('D10-8', 'duration-bounded', dur < 120, Math.round(dur) + 's', '<120s', '');
  t('D10-8', 'cost-sustainable', calls <= budget, calls + '/' + budget, '<=budget', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D10-8', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D10-8', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D10-8', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

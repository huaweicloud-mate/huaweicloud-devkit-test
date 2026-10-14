// D6-2 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { callTool } = await import('file://' + HDKS + '/tools.mjs');
  const lat = [];
  for (let i = 0; i < 20; i++) {
    const s = Date.now();
    await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--limit=5'] });
    lat.push(Date.now() - s);
  }
  lat.sort((a, b) => a - b);
  const p95 = lat[Math.floor(lat.length * 0.95)];
  const mean = Math.round(lat.reduce((a, b) => a + b, 0) / lat.length);
  t('D6-2', 'p95-under-3s', p95 < 3000, p95 + 'ms', '<3000ms', 'mean=' + mean + 'ms leader-path=plan_cli_command(local, deterministic); true cloud read-only deferred to main thread');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D6-2', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D6-2', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D6-2', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

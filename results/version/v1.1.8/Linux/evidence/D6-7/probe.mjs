// D6-7 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const before = process.memoryUsage().heapUsed;
  let okCalls = 0;
  for (let i = 0; i < 300; i++) {
    const r = await callTool('huaweicloud_service_catalog', { intent: i % 2 ? '查云主机' : '查对象存储' });
    if (Array.isArray(r && r.recommendedServices)) okCalls += 1;
  }
  const after = process.memoryUsage().heapUsed;
  const delta = after - before;
  t('D6-7', 'no-failure-over-300-calls', okCalls === 300, okCalls + '/300', 300, '');
  t('D6-7', 'heap-stable', delta < 50 * 1024 * 1024, delta + 'B', '<50MB', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D6-7', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D6-7', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D6-7', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

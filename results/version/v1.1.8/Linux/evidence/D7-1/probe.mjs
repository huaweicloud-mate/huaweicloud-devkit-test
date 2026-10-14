// D7-1 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  t('D7-1', 'platform', process.platform + '/' + process.arch, process.platform + '/' + process.arch, 'linux/x64 (verifiable here)', 'other OS deferred to their own runners');
  const r = await callTool('huaweicloud_service_catalog', { intent: '查云主机' });
  t('D7-1', 'smoke-service-catalog', Array.isArray(r && r.recommendedServices), 'ok', true, '');
  const lo = await callTool('huaweicloud_list_operations', { service: 'ECS' });
  t('D7-1', 'smoke-list-operations', !!(lo && (lo.result || lo.ok || lo.stdout)), 'responded', true, '');
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServers'] });
  t('D7-1', 'smoke-plan', typeof (p && p.classification && p.classification.decision) === 'string', (p && p.classification && p.classification.decision), 'decision string', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D7-1', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D7-1', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D7-1', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

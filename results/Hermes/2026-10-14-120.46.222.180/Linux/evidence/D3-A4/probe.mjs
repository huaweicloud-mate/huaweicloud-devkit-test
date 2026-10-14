// D3-A4 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { callTool, TOOL_DEFINITIONS } = await import('file://' + HDKS + '/tools.mjs');
  const lr = await callTool('huaweicloud_list_regions', {});
  const regs = (lr && (lr.regions || lr.staticRegions)) || [];
  const hasBj4 = regs.some((r) => /cn-north-4/.test(String(r.id || '')) || /北京四/.test(String(r.description || r.descr || '')));
  const hasCnSouth = regs.some((r) => /cn-south-1/.test(String(r.id || '')));
  t('D3-A4', 'region-cn-north-4', hasBj4, regs.map((r) => r.id).join(',').slice(0, 120), 'contains cn-north-4 (北京四)', '');
  t('D3-A4', 'region-cn-south-1', hasCnSouth, hasCnSouth, 'contains cn-south-1', '');
  const ga = await callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-north-4' });
  t('D3-A4', 'availability-ecs-bj4', !!(ga && ga.ok === true && ga.available === true), JSON.stringify(ga).slice(0, 120), 'available=true', '');
  const gaBad = await callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'no-such-region-xyz' });
  t('D3-A4', 'no-blind-scan', !!(gaBad && gaBad.available === false), JSON.stringify(gaBad && gaBad.available), 'available=false (unknown region)', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-A4', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-A4', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-A4', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

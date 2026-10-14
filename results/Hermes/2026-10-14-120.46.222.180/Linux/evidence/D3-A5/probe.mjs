// D3-A5 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const ga = await callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-north-4' });
  t('D3-A5', 'ecs-cn-north-4', !!(ga && ga.ok === true && ga.available === true), JSON.stringify(ga && ga.available), 'true', '');
  const gaObs = await callTool('huaweicloud_get_regional_availability', { service: 'obs', region: 'cn-south-1' });
  t('D3-A5', 'obs-cn-south-1', !!(gaObs && gaObs.available === true), JSON.stringify(gaObs && gaObs.available), 'true', '');
  const cat = await callTool('huaweicloud_service_catalog', { intent: '查 ecs 云主机' });
  t('D3-A5', 'capabilityOrder', Array.isArray(cat && cat.capabilityOrder) && cat.capabilityOrder.length >= 5, (cat && cat.capabilityOrder && cat.capabilityOrder.length) || 0, '>=5', '');
  t('D3-A5', 'ruleOfThumb', !!(cat && cat.ruleOfThumb && cat.ruleOfThumb.cli), JSON.stringify(cat && cat.ruleOfThumb && cat.ruleOfThumb.cli), 'present', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-A5', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-A5', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-A5', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

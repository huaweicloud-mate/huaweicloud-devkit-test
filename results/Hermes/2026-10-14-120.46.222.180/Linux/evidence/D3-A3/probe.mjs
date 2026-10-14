// D3-A3 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const demo = await callTool('huaweicloud_service_catalog', { intent: '免费快速预览部署一个静态网页' });
  const demoSkills = Array.isArray(demo && demo.recommendedSkills) ? demo.recommendedSkills : [];
  const demoFirst = demoSkills[0];
  t('D3-A3', 'demo-routes-sandbox', demoFirst === 'huawei-sandbox', String(demoFirst), 'huawei-sandbox', 'demoSkills=' + demoSkills.join(','));
  const prod = await callTool('huaweicloud_service_catalog', { intent: '生产环境在云服务器上部署应用' });
  const prodSvcs = Array.isArray(prod && prod.recommendedServices) ? prod.recommendedServices : [];
  const prodOk = prodSvcs.some((s) => ['ECS', 'CCE'].includes(s));
  t('D3-A3', 'prod-routes-compute', prodOk, prodSvcs.join('+'), 'ECS/CCE', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-A3', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-A3', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-A3', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

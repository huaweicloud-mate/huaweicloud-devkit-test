// D3-A6 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const icon = await callTool('huaweicloud_get_service_icon', { service: 'ecs' });
  const ico = icon && icon.ok === true && Array.isArray(icon.results) && icon.results.length > 0;
  const hasCdn = icon && Array.isArray(icon.results) && icon.results.some((r) => r.logo && typeof r.logo.source_url === 'string');
  t('D3-A6', 'icon-hit', ico, (icon && icon.count) || 0, '>0 results', 'warn=' + JSON.stringify(icon && icon.warn));
  t('D3-A6', 'icon-cdn-source', hasCdn, hasCdn, 'logo.source_url string', '');
  let mp = null, mpErr = '';
  try { mp = await callTool('huaweicloud_search_marketplace', { query: 'ecs' }); } catch (e) { mpErr = e.message; }
  const mpOk = mp && mp.ok === true && Array.isArray(mp.results) && typeof mp.count === 'number';
  t('D3-A6', 'marketplace-hit', mpOk, mp ? mp.count : 'ERR:' + mpErr.slice(0, 120), 'ok + results + count', mpErr ? '' : '');
  t('D3-A6', 'marketplace-scored', mpOk && mp.results.every((r) => typeof r.score === 'number'), mpOk ? 'all scored' : 'n/a', true, mpErr ? 'network err, skipped scoring' : '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-A6', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-A6', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-A6', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

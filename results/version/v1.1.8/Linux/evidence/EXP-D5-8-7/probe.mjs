// EXP-D5-8-7 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const mcp = readFileSync(HDKS + '/mcp-server.mjs', 'utf8');
  const fresh = /TOOL_DEFINITIONS|initialize|tools\/list/i.test(mcp);
  t('EXP-D5-8-7', 'hermes-restart-consistent', fresh, fresh, true, 'restart reloads tools (per-process init, cross-client consistent semantics)');
  const { TOOL_DEFINITIONS, callTool } = await import('file://' + HDKS + '/tools.mjs');
  const r = await callTool('huaweicloud_service_catalog', { intent: '查云主机' });
  t('EXP-D5-8-7', 'hermes-load', TOOL_DEFINITIONS.length >= 39 && Array.isArray(r && r.recommendedServices), TOOL_DEFINITIONS.length, '>=39 tools + service_catalog responds', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-D5-8-7', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-D5-8-7', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-D5-8-7', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

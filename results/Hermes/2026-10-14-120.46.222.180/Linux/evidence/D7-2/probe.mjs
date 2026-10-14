// D7-2 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const major = parseInt(process.version.replace(/^v/, '').split('.')[0], 10);
  t('D7-2', 'node-gte-22', major >= 22, process.version, '>=22', '');
  const pkg = JSON.parse(readFileSync('/home/testbot1/devkit-test/Hermes/hdk/package.json', 'utf8'));
  const engines = pkg.engines && pkg.engines.node;
  t('D7-2', 'engines-contract', typeof engines === 'string' && engines.length > 0, String(engines), 'engines.node declared', '');
  const { TOOL_DEFINITIONS } = await import('file://' + HDKS + '/tools.mjs');
  t('D7-2', 'smoke-load', Array.isArray(TOOL_DEFINITIONS) && TOOL_DEFINITIONS.length >= 39, TOOL_DEFINITIONS.length, '>=39 tools', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D7-2', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D7-2', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D7-2', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

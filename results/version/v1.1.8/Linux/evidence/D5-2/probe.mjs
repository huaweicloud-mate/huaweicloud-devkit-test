// D5-2 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const pluginDir = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src'.replace(/\/src$/, '');
  const pluginJson = JSON.parse(readFileSync(pluginDir + '/.hermes-plugin/plugin.json', 'utf8'));
  t('D5-2', 'plugin-name', pluginJson.name === 'huaweicloud-devkit', pluginJson.name, 'huaweicloud-devkit', '');
  t('D5-2', 'plugin-version', typeof pluginJson.version === 'string' && pluginJson.version.length > 0, pluginJson.version, 'string semver', '');
  t('D5-2', 'mcp-json-present', existsSync(pluginDir + '/.mcp.json'), 'present', 'present', '');
  const integYaml = readFileSync('/home/testbot1/devkit-test/Hermes/hdk/integrations/hermes/manifest.yaml', 'utf8');
  const skillsDest = /\.hermes\/skills/.test(integYaml);
  const configYaml = /config\.yaml/.test(integYaml);
  t('D5-2', 'hermes-skills-dest', skillsDest, '~/.hermes/skills referenced', true, '');
  t('D5-2', 'hermes-config-dest', configYaml, 'config.yaml referenced', true, '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D5-2', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D5-2', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D5-2', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

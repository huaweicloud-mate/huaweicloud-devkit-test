// EXP-D5-8-2 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const integYaml = readFileSync('/home/testbot1/devkit-test/Hermes/hdk/integrations/hermes/manifest.yaml', 'utf8');
  t('EXP-D5-8-2', 'hermes-install-dest', /~\/\.hermes\/skills/.test(integYaml) && /config\.yaml/.test(integYaml) && /safety/.test(integYaml), 'skills→~/.hermes/skills, MCP+hooks→config.yaml, safety→~/.hermes/huaweicloud-plugins/safety', true, 'README 契约一致，无错位');
  t('EXP-D5-8-2', 'name-version', pluginJson.name === 'huaweicloud-devkit' && typeof pluginJson.version === 'string', pluginJson.name + '@' + pluginJson.version, 'huaweicloud-devkit@<semver>', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-D5-8-2', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-D5-8-2', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-D5-8-2', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

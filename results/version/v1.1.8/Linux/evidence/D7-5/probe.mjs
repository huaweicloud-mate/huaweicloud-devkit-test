// D7-5 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const merge = await import('file://' + HDKS + '/mcp-config-merge.mjs');
  const mcpPath = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
  // mergeArgsStyle must NOT overwrite user env
  const existing = { type: 'stdio', command: 'node', args: ['/old/path.mjs'], env: { MY_VAR: 'user-value' } };
  const merged = merge.mergeArgsStyle(existing, { mcpPath, env: { REQUIRED_ENV: 'installer-default' }, defaultTimeout: 300000 });
  t('D7-5', 'merge-keeps-user-env', merged.entry.env.MY_VAR === 'user-value', JSON.stringify(merged.entry.env), 'MY_VAR=user-value preserved', '');
  const existing2 = { type: 'stdio', command: 'node', args: ['/old.mjs'], env: { REQUIRED_ENV: 'user-override' } };
  const merged2 = merge.mergeArgsStyle(existing2, { mcpPath, env: { REQUIRED_ENV: 'installer-default' } });
  t('D7-5', 'no-overwrite-existing', merged2.entry.env.REQUIRED_ENV === 'user-override', merged2.entry.env.REQUIRED_ENV, 'user-override (not installer-default)', '');
  const config = { mcpServers: { 'huaweicloud-devkit': { command: 'node', args: ['/old.mjs'] }, other: { command: 'node', args: ['/x.mjs'] } } };
  const m3 = merge.mergeMcpServersFile(config, { mcpPath, env: {} });
  t('D7-5', 'merge-preserves-other-keys', m3.config.mcpServers.other !== undefined && m3.config.mcpServers['huaweicloud-devkit'].args[0] === mcpPath, JSON.stringify(Object.keys(m3.config.mcpServers)), 'other key intact + devkit merged', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D7-5', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D7-5', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D7-5', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

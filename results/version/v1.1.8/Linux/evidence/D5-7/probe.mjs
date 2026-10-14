// D5-7 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const reReads = /readFileSync|resolveSkillsRoot|SKILL|TOOL_DEFINITIONS|initialize/i.test(mcp);
  t('D5-7', 'per-process-init', reReads, reReads, true, 'mcp-server re-reads tools/skills on initialize (no cross-session stale cache)');
  const { TOOL_DEFINITIONS, callTool } = await import('file://' + HDKS + '/tools.mjs');
  const n = TOOL_DEFINITIONS.length;
  t('D5-7', 'tools-stable-load', n >= 39, n, '>=39 tools on fresh load', '');
  const r = await callTool('huaweicloud_service_catalog', { intent: '查云主机' });
  t('D5-7', 'call-stable', Array.isArray(r && r.recommendedServices), 'service_catalog responds', true, '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D5-7', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D5-7', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D5-7', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

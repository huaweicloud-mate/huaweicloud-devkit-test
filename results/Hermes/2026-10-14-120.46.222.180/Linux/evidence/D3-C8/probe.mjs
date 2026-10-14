// D3-C8 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const ep = 'eps-tctest-c8-0001';
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['EVS', 'CreateVolume', '--volume.name=tctest-c8-vol', '--volume.size=1', '--availability_zone=cn-north-4a', '--enterprise_project_id=' + ep] });
  const hasEp = typeof p.command === 'string' && p.command.includes('enterprise_project_id=' + ep);
  t('D3-C8', 'param-enterprise-project-id', hasEp, typeof p.command === 'string' ? p.command.slice(0, 200) : '', 'command contains --enterprise_project_id=' + ep, '');
  const dec = (p.classification || {}).decision;
  t('D3-C8', 'write-not-auto-allow', dec !== 'allow', dec, '!= allow (needs approval, no default-drop)', '');
  const e = await callTool('huaweicloud_explain_error', { service: 'APIG', errorCode: 'APIC.7241', message: '' });
  t('D3-C8', 'eps-guidance', Array.isArray(e.suggestions) && e.suggestions.some((s) => /enterprise_project_id/i.test(s)), (e.suggestions || []).join(' | ').slice(0, 160), 'mentions enterprise_project_id', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-C8', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-C8', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-C8', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

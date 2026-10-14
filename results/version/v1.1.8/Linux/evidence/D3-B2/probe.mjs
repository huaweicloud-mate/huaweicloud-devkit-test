// D3-B2 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--limit=5'] });
  const cmd = typeof p.command === 'string' ? p.command : '';
  t('D3-B2', 'command-syntax', cmd.startsWith('hcloud ') && cmd.includes('ListServersDetails') && cmd.includes('--cli-region=cn-north-4'), cmd.slice(0, 120), 'hcloud ECS ListServersDetails ...', '');
  const cls = p.classification || {};
  t('D3-B2', 'read-only-allow', cls.decision === 'allow', cls.decision, 'allow', '');
  t('D3-B2', 'approval-token', typeof p.approvalToken === 'string' && p.approvalToken.length > 8, String(p.approvalToken).slice(0, 40), 'uuid string', '');
  t('D3-B2', 'safe-to-run', p.safeToRun === true, p.safeToRun, true, '');
  const pw = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--server.name=tctest', '--imageRef=img', '--flavorRef=flv'] });
  t('D3-B2', 'write-needs-approval', ((pw.classification || {}).decision) !== 'allow', (pw.classification || {}).decision, '!= allow', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-B2', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-B2', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-B2', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

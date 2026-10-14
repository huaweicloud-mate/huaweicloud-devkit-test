// D3-B4 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  const e1 = await callTool('huaweicloud_explain_error', { service: 'APIGW', errorCode: 'APIGW.0301', message: 'Incorrect IAM authentication information' });
  const a1 = Array.isArray(e1.suggestions) && e1.suggestions.length > 0 && e1.suggestions.some((s) => /AK|SK|auth init|project_id/i.test(s));
  t('D3-B4', 'apigw-0301-actionable', a1, (e1.suggestions || []).join(' | ').slice(0, 160), 'actionable next step', '');
  const e2 = await callTool('huaweicloud_explain_error', { service: 'FSS', errorCode: 'FSS.1078', message: '' });
  const a2 = Array.isArray(e2.suggestions) && e2.suggestions.some((s) => /filename/i.test(s));
  t('D3-B4', 'fss-1078-actionable', a2, (e2.suggestions || []).join(' | ').slice(0, 160), 'code_filename guidance', '');
  const e3 = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.9000', message: 'quota exceeded, reach the limit' });
  const a3 = Array.isArray(e3.suggestions) && e3.suggestions.some((s) => /quota|limit/i.test(s));
  t('D3-B4', 'quota-actionable', a3, (e3.suggestions || []).join(' | ').slice(0, 160), 'quota guidance', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-B4', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-B4', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-B4', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

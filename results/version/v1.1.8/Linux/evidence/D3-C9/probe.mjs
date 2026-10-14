// D3-C9 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
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
  // freeze fixture → explain_error guidance (EVS.5400)
  const ez = await callTool('huaweicloud_explain_error', { service: 'EVS', errorCode: 'EVS.5400', message: 'volume status is frozen' });
  t('D3-C9', 'frozen-guidance', Array.isArray(ez.suggestions) && ez.suggestions.length > 0, (ez.suggestions || []).join(' | ').slice(0, 200), 'non-empty guidance (SIM fixture)', 'evidence-level=SIM(frozen), real=nonexistent lookup');
  // nonexistent resource: real read-only lookup, no create/delete
  let shownf = null, nfErr = '';
  try {
    shownf = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ShowVpc', '--vpc_id=nonexistent-' + Date.now(), '--cli-region=cn-north-4'], timeoutMs: 30000, maxRetries: 0 });
  } catch (e) { nfErr = e.message; }
  const raw = JSON.stringify(shownf);
  const nfOk = (shownf && shownf.ok === false) || /APIGW\.0101|not.?found|NotFound|does not exist|VPC\.0|Ecs\..*404/i.test(raw);
  t('D3-C9', 'nonexistent-guide', nfOk, raw.slice(0, 220), 'structured error (APIGW.0101 / not found)', nfErr);

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-C9', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-C9', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-C9', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

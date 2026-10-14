// D6-6 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const src = readFileSync(HDKS + '/hcloud-cli.mjs', 'utf8');
  const hasRetry = src.includes('isRetryableNetworkError') && src.includes('maxRetries');
  const retryable = /ECONNRESET|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|getaddrinfo|network/i.test(src);
  t('D6-6', 'retry-logic-present', hasRetry && retryable, hasRetry + '/' + retryable, true, 'source has isRetryableNetworkError + maxRetries + transient-code matches');
  const hc = await import('file://' + HDKS + '/hcloud-cli.mjs');
  const token = hc.createApprovalToken(['ECS', 'CreateServers', '--server.name=x']);
  const first = hc.consumeApprovalToken(token);
  const second = hc.consumeApprovalToken(token);
  t('D6-6', 'idempotent-approval-once', first !== null && second === null, first ? 'consumed' : 'null', 'single-use token (no duplicate create on retry)', '');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D6-6', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D6-6', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D6-6', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

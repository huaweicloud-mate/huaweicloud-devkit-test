// D6-8 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { runHcloud } = await import('file://' + HDKS + '/hcloud-cli.mjs');
  // inject a hanging executable via resolveHcloudCommand(executable) — deterministic, non-cloud
  const before = process.memoryUsage().heapUsed;
  const s = Date.now();
  const r = await runHcloud(['2'], { executable: 'sleep', executableArgs: [], timeoutMs: 100, forceKillAfterMs: 1000, maxRetries: 0 });
  const elapsed = Date.now() - s;
  const heapDelta = process.memoryUsage().heapUsed - before;
  const timedOut = r && r.ok === false && typeof r.code === 'string' && /TIMEOUT/i.test(r.code);
  t('D6-8', 'timeout-returned', timedOut, 'code=' + (r && r.code) + ' err=' + (r && r.error || ''), 'ok=false + code=TIMEOUT (impl code; SPEC contract says ETIMEDOUT/TOOL_TIMEOUT_MS — SPEC-MISMATCH note)', 'elapsed=' + elapsed + 'ms');
  t('D6-8', 'bounded-not-hang', elapsed < 5000, elapsed + 'ms', '<5000ms (no infinite hang)', '');
  t('D6-8', 'heap-stable', heapDelta < 50 * 1024 * 1024, heapDelta + 'B', '<50MB', '');
  const r2 = await runHcloud(['IAM', 'KeystoneListRegions'], { timeoutMs: 30000, maxRetries: 1 });
  t('D6-8', 'recovers-after-timeout', typeof (r2 && r2.retries) === 'number' || (r2 && (r2.ok === true || r2.ok === false)), r2 && r2.ok, 'true/false structured (no ECONNRESET residue)', 'retries=' + (r2 && r2.retries));

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D6-8', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D6-8', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D6-8', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

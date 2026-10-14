// D6-5 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');
  const { detectFramework } = await import('file://' + HDKS + '/detect-framework.mjs');
  const sm = await import('file://' + HDKS + '/sandbox/session-manager.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'd6-5-bigdir-'));
  const N = 10000;
  const t0 = Date.now();
  for (let i = 0; i < N; i++) writeFileSync(join(dir, 'f' + i + '.txt'), 'x'.repeat(20));
  const genMs = Date.now() - t0;
  const memBefore = process.memoryUsage().heapUsed;
  const s = Date.now();
  let dfr = detectFramework(dir);
  const detMs = Date.now() - s;
  const heapDelta = process.memoryUsage().heapUsed - memBefore;
  t('D6-5', 'large-dir-detect-fast', detMs < 5000, detMs + 'ms', '<5000ms', 'files=' + N + ' gen=' + genMs + 'ms heapDelta=' + heapDelta + 'B result=' + (dfr ? dfr.framework || dfr.type : 'null'));
  t('D6-5', 'large-dir-heap-stable', heapDelta < 50 * 1024 * 1024, heapDelta + 'B', '<50MB', '');
  const big = 'z'.repeat(10 * 1024 * 1024);
  const b64 = Buffer.from(big).toString('base64');
  const chunks = sm.splitBase64Chunks(b64);
  t('D6-5', 'large-upload-chunked', chunks.length > 1 && chunks.join('') === b64, chunks.length + ' chunks', '>1 chunks + reassembly intact', '');
  rmSync(dir, { recursive: true, force: true });

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D6-5', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D6-5', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D6-5', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

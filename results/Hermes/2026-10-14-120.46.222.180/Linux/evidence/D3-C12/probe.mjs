// D3-C12 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const sm = await import('file://' + HDKS + '/sandbox/session-manager.mjs');
  t('D3-C12', 'chunk-size', sm.UPLOAD_CHUNK_SIZE === 30000, sm.UPLOAD_CHUNK_SIZE, 30000, '');
  t('D3-C12', 'batch-size', sm.UPLOAD_BATCH_SIZE === 2, sm.UPLOAD_BATCH_SIZE, 2, '');
  t('D3-C12', 'max-retries', sm.UPLOAD_MAX_RETRIES === 3, sm.UPLOAD_MAX_RETRIES, 3, '');
  const data = 'y'.repeat(70001);
  const b64 = Buffer.from(data).toString('base64');
  const chunks = sm.splitBase64Chunks(b64);
  const expectedN = Math.ceil(b64.length / 30000);
  t('D3-C12', 'chunk-split-correct', chunks.length === expectedN && chunks.every((c) => c.length <= 30000), chunks.length + '/' + expectedN + ' chunks', expectedN, '');
  t('D3-C12', 'chunk-idempotent', chunks.join('') === b64, chunks.join('') === b64, true, 'reassembly==original base64');
  t('D3-C12', 'closeSession-fn', typeof sm.closeSession === 'function', typeof sm.closeSession, 'function', 'per-workspace close (no monolithic closeAllSessions: batch close = loop over workspaces)');

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'D3-C12', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'D3-C12', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'D3-C12', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

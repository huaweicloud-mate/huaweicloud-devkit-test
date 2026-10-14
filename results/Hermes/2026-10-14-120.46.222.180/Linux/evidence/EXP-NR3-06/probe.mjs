// EXP-NR3-06 — real hdk probe (no hardcoded PASS: status computed from runtime assertions)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const HDKS = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = '/home/testbot1/devkit-test/Hermes/hdk';
const results = [];
function t(id, name, pass, actual, expected, detail = '') {
  results.push({ id, name, pass, actual: String(actual).slice(0, 200), expected: String(expected).slice(0, 120), detail: String(detail).slice(0, 400) });
}
let __status = null;
async function main() {

  const uc = await import('file://' + HDKS + '/update-check.mjs');
  uc.invalidateUpdateCache();
  let qc = 0;
  const doQuery = async () => { qc += 1; return { latest: '1.1.9', next: null }; };
  const r1 = await uc.getCachedUpdateInfo('1.1.8', { sessionId: 'nr3-06', doQuery });
  const r2 = await uc.getCachedUpdateInfo('1.1.8', { sessionId: 'nr3-06', doQuery });
  t('EXP-NR3-06', 'cache-reuse-ttl', r1.result === 'update_available' && r2.result === 'update_available' && qc === 1, 'qc=' + qc + ' r1=' + r1.result, '1 query (TTL 1h reuse)', '');
  // failure throttle: fresh cache invalidation, failing query, second call within throttle must not re-call doQuery
  uc.invalidateUpdateCache();
  let fqc = 0;
  const failQuery = async () => { fqc += 1; return null; };
  const f1 = await uc.getCachedUpdateInfo('1.1.8', { sessionId: 'nr3-06', doQuery: failQuery });
  const f2 = await uc.getCachedUpdateInfo('1.1.8', { sessionId: 'nr3-06', doQuery: failQuery });
  t('EXP-NR3-06', 'failure-throttle', f1.result === 'check_failed' && f2.result === 'check_failed' && fqc === 1, 'fqc=' + fqc + ' r=' + f1.result, 'failed once, 5min throttle', '');
  t('EXP-NR3-06', 'inline-check-failed', uc.judgeUpdate('1.1.8', null).result === 'check_failed', uc.judgeUpdate('1.1.8', null).result, 'check_failed (不阻塞)', '');
  uc.invalidateUpdateCache();

}
main()
  .then(() => {
    const passed = results.filter((r) => r.pass).length;
    const failed = results.filter((r) => !r.pass).length;
    const status = __status || (failed === 0 ? 'PASS' : 'FAIL');
    const payload = { case: 'EXP-NR3-06', status, total: results.length, passed, failed, results };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify(payload));
  })
  .catch((e) => {
    const payload = { case: 'EXP-NR3-06', status: 'FAIL', total: 0, passed: 0, failed: 1, results: [{ id: 'EXP-NR3-06', name: 'probe-error', pass: false, actual: String((e && e.message) || e).slice(0, 400) }] };
    writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(payload, null, 2), 'utf8');
    console.error(e);
    process.exit(1);
  });

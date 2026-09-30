// D6-4: 并发请求稳定性 — verify concurrent dispatch calls complete without errors
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

const N = 50;
const concurrency = 10;
const batches = N / concurrency;
let successCount = 0;
let errorCount = 0;
const errors = [];

for (let b = 0; b < batches; b++) {
  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(
      dispatch('tools/list', {})
        .then(r => { if (r.tools?.length > 0) successCount++; })
        .catch(e => { errorCount++; errors.push(e.message); })
    );
  }
  await Promise.all(promises);
}

const ok = successCount === N && errorCount === 0;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D6-4',
  why: ok ? `${N} concurrent requests (${batches} batches x ${concurrency}) all succeeded.` : `successCount=${successCount}, errorCount=${errorCount}`,
  executedAt: '20260930103000',
  N, concurrency, successCount, errorCount,
  errors: errors.slice(0, 5)
}, null, 2));
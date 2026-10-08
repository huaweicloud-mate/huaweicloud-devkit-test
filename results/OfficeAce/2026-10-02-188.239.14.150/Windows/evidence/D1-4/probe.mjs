// D1-4: status/update幂等 — verify repeated status checks are idempotent
import { loadUpdateCheck } from '../_helper.mjs';
const { judgeUpdate, semverCompare } = await loadUpdateCheck();

// Test idempotent behavior: same input -> same output
const distTags = { latest: '1.1.7', next: '1.1.8-next.1' };
const skipState = null;
const r1 = judgeUpdate('1.1.8-next.1', distTags, skipState);
const r2 = judgeUpdate('1.1.8-next.1', distTags, skipState);
const r3 = judgeUpdate('1.1.8-next.1', distTags, skipState);

const idempotent = JSON.stringify(r1) === JSON.stringify(r2) && JSON.stringify(r2) === JSON.stringify(r3);

// Also verify semverCompare is consistent
const cmp1 = semverCompare('1.1.7', '1.1.8');
const cmp2 = semverCompare('1.1.7', '1.1.8');
const cmpConsistent = cmp1 === cmp2 && cmp1 === -1;

const ok = idempotent && cmpConsistent;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-4',
  why: ok ? 'judgeUpdate is idempotent (3 calls produce identical results) and semverCompare is consistent.' : `idempotent=${idempotent}, cmpConsistent=${cmpConsistent}`,
  executedAt: '20261001103000',
  r1: { result: r1.result, updateAvailable: r1.updateAvailable },
  idempotent
}, null, 2));
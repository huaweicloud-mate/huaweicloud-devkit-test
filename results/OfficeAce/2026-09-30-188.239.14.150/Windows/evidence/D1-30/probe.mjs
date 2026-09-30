// D1-30: semver比对 — verify semverCompare handles all cases
import { loadUpdateCheck } from '../_helper.mjs';
const { semverCompare, semverParse, hasPrerelease } = await loadUpdateCheck();

const tests = [
  { a: '1.0.0', b: '1.0.1', expect: -1 },
  { a: '1.0.0', b: '1.1.0', expect: -1 },
  { a: '1.0.0', b: '2.0.0', expect: -1 },
  { a: '1.0.1', b: '1.0.0', expect: 1 },
  { a: '1.0.0', b: '1.0.0', expect: 0 },
  { a: '1.0.0', b: '1.0.0-beta', expect: 1 },  // release > prerelease
  { a: '1.0.0-beta', b: '1.0.0', expect: -1 },
  { a: '1.0.0-alpha', b: '1.0.0-beta', expect: -1 },
  { a: '1.1.8-next.1', b: '1.1.7', expect: 1 },
  { a: '1.1.7', b: '1.1.8-next.1', expect: -1 },
];

let allPass = true;
const details = [];
for (const t of tests) {
  const result = semverCompare(t.a, t.b);
  const pass = result === t.expect;
  details.push({ a: t.a, b: t.b, expect: t.expect, got: result, pass });
  if (!pass) allPass = false;
}

// Test parse
const parsed = semverParse('1.1.8-next.1');
const parseOk = parsed?.major === 1 && parsed?.minor === 1 && parsed?.patch === 8 && parsed?.pre?.[0] === 'next' && parsed?.pre?.[1] === '1';

// Test hasPrerelease
const preCheck = hasPrerelease('1.1.8-next.1') === true && hasPrerelease('1.1.7') === false;

const ok = allPass && parseOk && preCheck;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-30',
  why: ok ? `All ${tests.length} semver comparisons correct, parse correct, prerelease detection correct.` : 'Some comparisons failed.',
  executedAt: '20260930103000',
  details,
  parseOk,
  preCheck
}, null, 2));
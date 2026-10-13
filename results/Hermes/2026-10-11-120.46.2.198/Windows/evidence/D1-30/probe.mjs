// Evidence for D1-30: semver comparison correctness
import { semverCompare } from './plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'node:fs';

const results = {};

// D1-30: semver comparison correctness
try {
  const tests = [
    { a: '1.1.7', b: '1.1.6', expect: 1, desc: 'newer > older' },
    { a: '1.1.6', b: '1.1.7', expect: -1, desc: 'older < newer' },
    { a: '1.1.7', b: '1.1.7', expect: 0, desc: 'equal' },
    { a: '1.2.0', b: '1.1.7', expect: 1, desc: 'higher minor > lower' },
    { a: '1.1.0', b: '1.1.0-next.9', expect: 1, desc: 'stable > prerelease of SAME version' },
    { a: '1.1.7', b: '1.1.8-next.2', expect: -1, desc: '1.1.7 < 1.1.8-next.2 (different patch, 8>7)' },
  ];
  const results_arr = tests.map(t => ({ ...t, actual: semverCompare(t.a, t.b), pass: semverCompare(t.a, t.b) === t.expect }));
  const allCorrect = results_arr.every(t => t.pass);
  
  results['D1-30'] = {
    status: allCorrect ? 'PASS' : 'FAIL',
    allCorrect,
    tests: results_arr.map(t => `${t.a} vs ${t.b} = ${t.actual} (expect ${t.expect}, ${t.pass ? 'OK' : 'WRONG'})`),
    why: `semverCompare: ${allCorrect ? 'all correct' : 'some wrong'} — stable > prerelease of same version, but stable < different higher version's prerelease`
  };
} catch(e) { results['D1-30'] = { status: 'BLOCKED', why: e.message }; }

const output = JSON.stringify(results, null, 2);
console.log(output);
writeFileSync('d1-30-results.json', output);

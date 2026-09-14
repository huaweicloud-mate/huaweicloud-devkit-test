// AI生成
// D1-30: semver comparison correctness
// Test: Call semverCompare with multiple inputs
// 1.1.2 > 1.1.1, 1.1.0 > 1.1.0-next.9, equal=0, invalid string lexicographic

const results = {
  testCase: 'D1-30',
  description: 'semver 比对正确性 (semverCompare multiple inputs)',
  platform: process.platform,
  nodeVersion: process.version,
  checks: {}
};

(async () => {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');
  const cmp = mod.semverCompare;

  // Group 1: Basic version comparisons
  results.checks['1.1.2 vs 1.1.1'] = {
    result: cmp('1.1.2', '1.1.1'),
    expected: 1,
    passed: cmp('1.1.2', '1.1.1') === 1
  };

  results.checks['1.1.1 vs 1.1.2'] = {
    result: cmp('1.1.1', '1.1.2'),
    expected: -1,
    passed: cmp('1.1.1', '1.1.2') === -1
  };

  // Group 2: Stable vs prerelease (stable > prerelease)
  results.checks['1.1.0 vs 1.1.0-next.9'] = {
    result: cmp('1.1.0', '1.1.0-next.9'),
    expected: 1,
    passed: cmp('1.1.0', '1.1.0-next.9') === 1
  };

  results.checks['1.1.0-next.9 vs 1.1.0'] = {
    result: cmp('1.1.0-next.9', '1.1.0'),
    expected: -1,
    passed: cmp('1.1.0-next.9', '1.1.0') === -1
  };

  // Group 3: Equal versions
  results.checks['1.1.0 vs 1.1.0 (equal)'] = {
    result: cmp('1.1.0', '1.1.0'),
    expected: 0,
    passed: cmp('1.1.0', '1.1.0') === 0
  };

  results.checks['1.1.1-next.12 vs 1.1.1-next.12 (equal)'] = {
    result: cmp('1.1.1-next.12', '1.1.1-next.12'),
    expected: 0,
    passed: cmp('1.1.1-next.12', '1.1.1-next.12') === 0
  };

  // Group 4: Prerelease numeric comparison (next.15 > next.9, not lexicographic)
  results.checks['1.1.1-next.15 vs 1.1.1-next.9 (numeric)'] = {
    result: cmp('1.1.1-next.15', '1.1.1-next.9'),
    expected: 1,
    note: 'Must be numeric comparison: 15 > 9, not lexicographic where "15" < "9"',
    passed: cmp('1.1.1-next.15', '1.1.1-next.9') === 1
  };

  results.checks['1.1.1-next.9 vs 1.1.1-next.15 (numeric)'] = {
    result: cmp('1.1.1-next.9', '1.1.1-next.15'),
    expected: -1,
    passed: cmp('1.1.1-next.9', '1.1.1-next.15') === -1
  };

  // Group 5: Major/minor version differences
  results.checks['2.0.0 vs 1.9.9'] = {
    result: cmp('2.0.0', '1.9.9'),
    expected: 1,
    passed: cmp('2.0.0', '1.9.9') === 1
  };

  results.checks['1.0.2 vs 1.1.0'] = {
    result: cmp('1.0.2', '1.1.0'),
    expected: -1,
    passed: cmp('1.0.2', '1.1.0') === -1
  };

  results.checks['1.1.0 vs 1.0.2'] = {
    result: cmp('1.1.0', '1.0.2'),
    expected: 1,
    passed: cmp('1.1.0', '1.0.2') === 1
  };

  // Group 6: Invalid strings → lexicographic fallback
  results.checks['invalid: "abc" vs "abd" (lexicographic)'] = {
    result: cmp('abc', 'abd'),
    expected: -1,
    note: 'Invalid semver → lexicographic string comparison',
    passed: cmp('abc', 'abd') === -1
  };

  results.checks['invalid: "xyz" vs "abc" (lexicographic)'] = {
    result: cmp('xyz', 'abc'),
    expected: 1,
    passed: cmp('xyz', 'abc') === 1
  };

  results.checks['invalid: "foo" vs "foo" (lexicographic equal)'] = {
    result: cmp('foo', 'foo'),
    expected: 0,
    passed: cmp('foo', 'foo') === 0
  };

  // Group 7: Mixed valid/invalid (one valid, one invalid → lexicographic)
  results.checks['mixed: "1.1.0" vs "not-a-version"'] = {
    result: cmp('1.1.0', 'not-a-version'),
    note: 'One invalid → falls back to lexicographic string comparison',
    passed: typeof cmp('1.1.0', 'not-a-version') === 'number'
  };

  // Group 8: Prerelease with different pre identifiers
  results.checks['1.1.0-next.15 vs 1.1.0-next.12'] = {
    result: cmp('1.1.0-next.15', '1.1.0-next.12'),
    expected: 1,
    passed: cmp('1.1.0-next.15', '1.1.0-next.12') === 1
  };

  // Group 9: Stable vs stable with different patch
  results.checks['1.1.2 vs 1.1.1 (patch diff)'] = {
    result: cmp('1.1.2', '1.1.1'),
    expected: 1,
    passed: cmp('1.1.2', '1.1.1') === 1
  };

  const allPassed = Object.values(results.checks).every(c => c.passed);
  results.verdict = allPassed ? 'PASS' : 'FAIL';
  results.summary = allPassed
    ? 'PASS: semverCompare correctly handles all cases: basic comparison, stable>prerelease, equal=0, numeric prerelease ordering, major/minor/patch differences, and invalid string lexicographic fallback.'
    : 'FAIL: semverCompare produces incorrect results for some inputs.';

  console.log(JSON.stringify(results, null, 2));
})();

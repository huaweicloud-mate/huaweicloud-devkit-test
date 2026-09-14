// AI生成
// D1-27: Detection semantic - already up to date
// Test: Call judgeUpdate with current==latest → result=up_to_date
// Expected: When current version equals latest, result should be 'up_to_date' and updateAvailable=false

const results = {
  testCase: 'D1-27',
  description: '检测语义-已是最新 (judgeUpdate current==latest → up_to_date)',
  platform: process.platform,
  nodeVersion: process.version,
  checks: {}
};

(async () => {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');

  // Scenario 1: current == latest (stable, exact match)
  const r1 = mod.judgeUpdate('1.1.3', { latest: '1.1.3', next: null }, null);
  results.checks.exact_match_stable = {
    input: { current: '1.1.3', distTags: { latest: '1.1.3', next: null } },
    result: r1.result,
    updateAvailable: r1.updateAvailable,
    targetVersion: r1.targetVersion,
    currentVersion: r1.currentVersion,
    passed: r1.result === 'up_to_date' && r1.updateAvailable === false
  };

  // Scenario 2: current == latest, next exists but current is stable (shouldn't look at next)
  const r2 = mod.judgeUpdate('1.1.3', { latest: '1.1.3', next: '1.1.4-next.3' }, null);
  results.checks.exact_match_with_next = {
    input: { current: '1.1.3', distTags: { latest: '1.1.3', next: '1.1.4-next.3' } },
    result: r2.result,
    updateAvailable: r2.updateAvailable,
    targetVersion: r2.targetVersion,
    passed: r2.result === 'up_to_date' && r2.updateAvailable === false
  };

  // Scenario 3: current is prerelease, current == next (latest available but current is next tag)
  const r3 = mod.judgeUpdate('1.1.4-next.3', { latest: '1.1.3', next: '1.1.4-next.3' }, null);
  results.checks.prerelease_at_next = {
    input: { current: '1.1.4-next.3', distTags: { latest: '1.1.3', next: '1.1.4-next.3' } },
    result: r3.result,
    updateAvailable: r3.updateAvailable,
    targetVersion: r3.targetVersion,
    note: 'current is prerelease at next tag; latest stable is older. determineTarget picks max(latest, next) for prerelease users.',
    passed: r3.result === 'up_to_date' && r3.updateAvailable === false
  };

  // Scenario 4: current > latest (local is ahead, e.g. local build)
  const r4 = mod.judgeUpdate('1.2.0', { latest: '1.1.3', next: null }, null);
  results.checks.local_ahead = {
    input: { current: '1.2.0', distTags: { latest: '1.1.3', next: null } },
    result: r4.result,
    updateAvailable: r4.updateAvailable,
    targetVersion: r4.targetVersion,
    passed: r4.result === 'up_to_date' && r4.updateAvailable === false
  };

  // Scenario 5: current == latest == next (all same)
  const r5 = mod.judgeUpdate('1.1.3', { latest: '1.1.3', next: '1.1.3' }, null);
  results.checks.all_same = {
    input: { current: '1.1.3', distTags: { latest: '1.1.3', next: '1.1.3' } },
    result: r5.result,
    updateAvailable: r5.updateAvailable,
    passed: r5.result === 'up_to_date' && r5.updateAvailable === false
  };

  const allPassed = Object.values(results.checks).every(c => c.passed);
  results.verdict = allPassed ? 'PASS' : 'FAIL';
  results.summary = allPassed
    ? 'PASS: judgeUpdate correctly returns up_to_date when current >= latest. No false update suggestion in all 5 scenarios.'
    : 'FAIL: judgeUpdate incorrectly suggests update when current == latest in some scenarios.';

  console.log(JSON.stringify(results, null, 2));
})();

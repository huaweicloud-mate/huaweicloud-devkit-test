// AI生成
// D1-28: Detection semantic - new version available
// Test: Call judgeUpdate with current < latest → result=update_available
// Expected: When current version is less than latest, result should be 'update_available' and updateAvailable=true

const results = {
  testCase: 'D1-28',
  description: '检测语义-有新版本 (judgeUpdate current < latest → update_available)',
  platform: process.platform,
  nodeVersion: process.version,
  checks: {}
};

(async () => {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');

  // Scenario 1: current < latest (stable, clear update available)
  const r1 = mod.judgeUpdate('1.0.2', { latest: '1.1.0', next: null }, null);
  results.checks.stable_update = {
    input: { current: '1.0.2', distTags: { latest: '1.1.0', next: null } },
    result: r1.result,
    updateAvailable: r1.updateAvailable,
    targetVersion: r1.targetVersion,
    currentVersion: r1.currentVersion,
    passed: r1.result === 'update_available' && r1.updateAvailable === true && r1.targetVersion === '1.1.0'
  };

  // Scenario 2: prerelease current, new stable available
  const r2 = mod.judgeUpdate('1.1.1-next.12', { latest: '1.1.1', next: '1.1.1-next.15' }, null);
  results.checks.prerelease_to_stable = {
    input: { current: '1.1.1-next.12', distTags: { latest: '1.1.1', next: '1.1.1-next.15' } },
    result: r2.result,
    updateAvailable: r2.updateAvailable,
    targetVersion: r2.targetVersion,
    passed: r2.result === 'update_available' && r2.updateAvailable === true
  };

  // Scenario 3: prerelease current, next has newer prerelease
  const r3 = mod.judgeUpdate('1.1.1-next.12', { latest: '1.1.0', next: '1.1.1-next.15' }, null);
  results.checks.prerelease_to_newer_prerelease = {
    input: { current: '1.1.1-next.12', distTags: { latest: '1.1.0', next: '1.1.1-next.15' } },
    result: r3.result,
    updateAvailable: r3.updateAvailable,
    targetVersion: r3.targetVersion,
    passed: r3.result === 'update_available' && r3.updateAvailable === true && r3.targetVersion === '1.1.1-next.15'
  };

  // Scenario 4: prerelease current at latest next, but stable is newer
  const r4 = mod.judgeUpdate('1.1.1-next.15', { latest: '1.1.1', next: '1.1.1-next.15' }, null);
  results.checks.prerelease_at_next_stable_newer = {
    input: { current: '1.1.1-next.15', distTags: { latest: '1.1.1', next: '1.1.1-next.15' } },
    result: r4.result,
    updateAvailable: r4.updateAvailable,
    targetVersion: r4.targetVersion,
    passed: r4.result === 'update_available' && r4.updateAvailable === true && r4.targetVersion === '1.1.1'
  };

  // Scenario 5: major version bump
  const r5 = mod.judgeUpdate('1.1.3', { latest: '2.0.0', next: null }, null);
  results.checks.major_bump = {
    input: { current: '1.1.3', distTags: { latest: '2.0.0', next: null } },
    result: r5.result,
    updateAvailable: r5.updateAvailable,
    targetVersion: r5.targetVersion,
    passed: r5.result === 'update_available' && r5.updateAvailable === true && r5.targetVersion === '2.0.0'
  };

  // Scenario 6: patch version bump
  const r6 = mod.judgeUpdate('1.1.3', { latest: '1.1.4', next: null }, null);
  results.checks.patch_bump = {
    input: { current: '1.1.3', distTags: { latest: '1.1.4', next: null } },
    result: r6.result,
    updateAvailable: r6.updateAvailable,
    targetVersion: r6.targetVersion,
    passed: r6.result === 'update_available' && r6.updateAvailable === true && r6.targetVersion === '1.1.4'
  };

  const allPassed = Object.values(results.checks).every(c => c.passed);
  results.verdict = allPassed ? 'PASS' : 'FAIL';
  results.summary = allPassed
    ? 'PASS: judgeUpdate correctly returns update_available when current < latest in all 6 scenarios. Target version is correctly identified.'
    : 'FAIL: judgeUpdate fails to detect available update in some scenarios.';

  console.log(JSON.stringify(results, null, 2));
})();

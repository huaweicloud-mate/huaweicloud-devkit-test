// AI生成
// D1-40: Mirror lag detection correctness
// Test: Query dist-tags from mirror vs official, verify no false update suggestion when mirror lags
// Expected: 不得提示版本倒退(远端<=本地不提示)
// If mirror version <= local → should not suggest update → PASS

const { spawnSync } = require('child_process');

const results = {
  testCase: 'D1-40',
  description: '镜像 lag 下检测正确性 - mirror lag should not suggest version downgrade',
  platform: process.platform,
  nodeVersion: process.version,
  checks: {}
};

// Step 1: Query mirror dist-tags
const mirrorResult = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json', '--registry=https://repo.huaweicloud.com/repository/npm/'], {
  encoding: 'utf8',
  shell: true,
  timeout: 30000
});
let mirrorTags = null;
try { mirrorTags = JSON.parse(mirrorResult.stdout); } catch {}
results.checks.mirror_query = {
  status: mirrorResult.status,
  distTags: mirrorTags
};

// Step 2: Query official dist-tags
const officialResult = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json', '--registry=https://registry.npmjs.org/'], {
  encoding: 'utf8',
  shell: true,
  timeout: 30000
});
let officialTags = null;
try { officialTags = JSON.parse(officialResult.stdout); } catch {}
results.checks.official_query = {
  status: officialResult.status,
  distTags: officialTags
};

// Step 3: Get local version
let localVersion = null;
try {
  const pkg = require('C:/Users/Administrator/devkit-test/OfficeAce/hdk/package.json');
  localVersion = pkg.version;
} catch {}
results.checks.local_version = localVersion;

// Step 4: Use semverCompare from source to evaluate
(async () => {
  const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');

  // Test with real mirror data
  if (mirrorTags) {
    const mirrorJudge = mod.judgeUpdate(localVersion, { latest: mirrorTags.latest, next: mirrorTags.next }, null);
    results.checks.mirror_judgeUpdate = {
      result: mirrorJudge.result,
      updateAvailable: mirrorJudge.updateAvailable,
      targetVersion: mirrorJudge.targetVersion,
      currentVersion: mirrorJudge.currentVersion
    };
  }

  // Test with official data
  if (officialTags) {
    const officialJudge = mod.judgeUpdate(localVersion, { latest: officialTags.latest, next: officialTags.next }, null);
    results.checks.official_judgeUpdate = {
      result: officialJudge.result,
      updateAvailable: officialJudge.updateAvailable,
      targetVersion: officialJudge.targetVersion,
      currentVersion: officialJudge.currentVersion
    };
  }

  // Step 5: Simulate a LAGGING mirror (mirror has older version than local)
  const laggingMirrorTags = { latest: '1.1.2', next: null }; // older than local 1.1.3
  const laggingJudge = mod.judgeUpdate(localVersion, laggingMirrorTags, null);
  results.checks.lagging_mirror_simulation = {
    scenario: 'mirror latest=1.1.2, local=1.1.3 (mirror lags behind local)',
    result: laggingJudge.result,
    updateAvailable: laggingJudge.updateAvailable,
    targetVersion: laggingJudge.targetVersion,
    shouldNotSuggestUpdate: laggingJudge.result === 'up_to_date' && !laggingJudge.updateAvailable
  };

  // Step 6: Simulate mirror with same version as local
  const sameVersionTags = { latest: localVersion, next: null };
  const sameJudge = mod.judgeUpdate(localVersion, sameVersionTags, null);
  results.checks.same_version_simulation = {
    scenario: `mirror latest=${localVersion}, local=${localVersion} (same version)`,
    result: sameJudge.result,
    updateAvailable: sameJudge.updateAvailable,
    shouldNotSuggestUpdate: sameJudge.result === 'up_to_date' && !sameJudge.updateAvailable
  };

  // Determine verdict
  const laggingCorrect = results.checks.lagging_mirror_simulation.shouldNotSuggestUpdate;
  const sameCorrect = results.checks.same_version_simulation.shouldNotSuggestUpdate;
  results.verdict = (laggingCorrect && sameCorrect) ? 'PASS' : 'FAIL';
  results.summary = (laggingCorrect && sameCorrect)
    ? 'PASS: When mirror version <= local version, judgeUpdate correctly returns up_to_date and does not suggest update/downgrade. Mirror lag scenario handled correctly.'
    : 'FAIL: judgeUpdate incorrectly suggests update when mirror version <= local version. Version downgrade would be suggested.';

  console.log(JSON.stringify(results, null, 2));
})();

// AI生成
// D1-39: Windows upgrade detection chain availability
// Test: spawnSync('npm.cmd') without shell:true on Windows → check for EINVAL
// Expected: Windows下检测链真实可用，不得 EINVAL 静默失败
// If EINVAL occurs → FAIL (bug exists), if no EINVAL → PASS

const { spawnSync } = require('child_process');
const path = require('path');

const results = {
  testCase: 'D1-39',
  description: 'Windows upgrade detection chain availability (spawnSync without shell:true)',
  platform: process.platform,
  nodeVersion: process.version,
  checks: {}
};

// Check 1: Raw spawnSync without shell:true (the bug scenario)
const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit@next', 'version'], { encoding: 'utf8' });
results.checks.spawnSync_no_shell = {
  status: r1.status,
  error: r1.error ? r1.error.code : null,
  hasEINVAL: r1.error && r1.error.code === 'EINVAL',
  stdout: r1.stdout ? r1.stdout.trim() : '',
  stderr: r1.stderr ? r1.stderr.trim() : ''
};

// Check 2: spawnSync WITH shell:true (should work)
const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit@next', 'version'], { encoding: 'utf8', shell: true });
results.checks.spawnSync_with_shell = {
  status: r2.status,
  error: r2.error ? r2.error.code : null,
  hasEINVAL: r2.error && r2.error.code === 'EINVAL',
  stdout: r2.stdout ? r2.stdout.trim() : '',
  stderr: r2.stderr ? r2.stderr.trim() : ''
};

// Check 3: Test the actual source code function queryDistTagsSync
// This is what the real MCP server uses internally
async function testSourceFunction() {
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs');
    const result = mod.queryDistTagsSync({ timeoutMs: 10000 });
    results.checks.queryDistTagsSync_source = {
      result: result,
      isNull: result === null,
      interpretation: result === null ? 'FAILED - returned null (likely EINVAL)' : 'SUCCESS - got distTags'
    };
  } catch (e) {
    results.checks.queryDistTagsSync_source = {
      error: e.message
    };
  }
}

(async () => {
  await testSourceFunction();

  // Determine pass/fail
  const hasEINVAL = results.checks.spawnSync_no_shell.hasEINVAL;
  results.verdict = hasEINVAL ? 'FAIL' : 'PASS';
  results.summary = hasEINVAL
    ? 'BUG CONFIRMED: spawnSync(npm.cmd) without shell:true produces EINVAL on Windows. The upgrade detection chain silently fails, returning null instead of version data. This means users on Windows will never see update notifications.'
    : 'PASS: spawnSync(npm.cmd) without shell:true works correctly on Windows. No EINVAL error.';

  console.log(JSON.stringify(results, null, 2));
})();

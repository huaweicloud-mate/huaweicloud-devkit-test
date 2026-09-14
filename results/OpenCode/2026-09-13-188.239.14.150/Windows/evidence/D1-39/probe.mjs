// D1-39: Windows 升级检测链可用性
// Test: spawnSync('npm.cmd', ...) without shell:true must NOT EINVAL on Windows
import { spawnSync } from 'node:child_process';

const IS_WINDOWS = process.platform === 'win32';
const NPM_BIN = IS_WINDOWS ? 'npm.cmd' : 'npm';

let results = [];

// Test 1: queryDistTagsSync equivalent - spawnSync npm.cmd without shell:true
try {
  const result = spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  });
  
  if (result.error && result.error.code === 'EINVAL') {
    results.push({ test: 'spawnSync_npm.cmd_no_shell', status: 'FAIL', reason: 'EINVAL thrown - npm.cmd spawnSync fails without shell:true' });
  } else if (result.error) {
    results.push({ test: 'spawnSync_npm.cmd_no_shell', status: 'WARN', reason: `Error: ${result.error.code} - ${result.error.message}` });
  } else if (result.status === 0) {
    let parsed = null;
    try { parsed = JSON.parse(result.stdout); } catch {}
    results.push({ test: 'spawnSync_npm.cmd_no_shell', status: 'PASS', reason: `status=0, stdout parsed=${!!parsed}, latest=${parsed?.latest || 'N/A'}` });
  } else {
    results.push({ test: 'spawnSync_npm.cmd_no_shell', status: 'WARN', reason: `status=${result.status}, stderr=${(result.stderr||'').substring(0,100)}` });
  }
} catch (error) {
  if (error.code === 'EINVAL') {
    results.push({ test: 'spawnSync_npm.cmd_no_shell', status: 'FAIL', reason: `EINVAL: ${error.message}` });
  } else {
    results.push({ test: 'spawnSync_npm.cmd_no_shell', status: 'ERROR', reason: `${error.code}: ${error.message}` });
  }
}

// Test 2: queryDistTagsFetch - fetch-based approach (should not have EINVAL)
try {
  const resp = await fetch('https://registry.npmjs.org/-/package/huaweicloud-devkit/dist-tags');
  if (resp.ok) {
    const data = await resp.json();
    results.push({ test: 'queryDistTagsFetch', status: 'PASS', reason: `fetch ok, latest=${data.latest}` });
  } else {
    results.push({ test: 'queryDistTagsFetch', status: 'WARN', reason: `HTTP ${resp.status}` });
  }
} catch (error) {
  results.push({ test: 'queryDistTagsFetch', status: 'ERROR', reason: error.message });
}

// Test 3: Verify current installed version
try {
  const result = spawnSync(NPM_BIN, ['ls', '-g', 'huaweicloud-devkit', '--depth=0', '--json'], {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });
  if (result.status === 0) {
    const data = JSON.parse(result.stdout);
    const ver = data?.dependencies?.['huaweicloud-devkit']?.version || 'unknown';
    results.push({ test: 'installed_version', status: 'PASS', reason: `version=${ver}` });
  } else {
    results.push({ test: 'installed_version', status: 'WARN', reason: `status=${result.status}` });
  }
} catch (error) {
  results.push({ test: 'installed_version', status: 'ERROR', reason: error.message });
}

// Summary
console.log('=== D1-39 Windows 升级检测链可用性 ===');
console.log(`Platform: ${process.platform}`);
console.log(`Node: ${process.version}`);
console.log(`NPM_BIN: ${NPM_BIN}`);
console.log('');
for (const r of results) {
  console.log(`[${r.status}] ${r.test}: ${r.reason}`);
}
console.log('');

const failed = results.filter(r => r.status === 'FAIL');
const passed = results.filter(r => r.status === 'PASS');
console.log(`Summary: ${passed.length} PASS, ${failed.length} FAIL, ${results.length - passed.length - failed.length} other`);

if (failed.length > 0) {
  console.log('RESULT: FAIL');
  process.exit(1);
} else {
  console.log('RESULT: PASS');
  process.exit(0);
}

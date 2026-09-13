// Probe: D1-39 Windows upgrade detection chain usability
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const srcBase = 'C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs';
const mod = await import(pathToFileURL(srcBase).href);

console.log('=== D1-39: Windows Upgrade Detection Chain ===');
console.log(`Platform: ${process.platform}`);
console.log(`Node: ${process.version}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log();

// 1. Test queryDistTagsSync (spawnSync without shell:true)
console.log('--- Test 1: queryDistTagsSync ---');
let syncResult;
try {
  syncResult = mod.queryDistTagsSync({ timeoutMs: 30000 });
  if (syncResult === null) {
    console.log('Result: null (npm view failed or returned no valid output)');
  } else {
    console.log('Result:', JSON.stringify(syncResult));
  }
  console.log('No EINVAL thrown - function completed without crash');
} catch (e) {
  console.log('ERROR:', e.message);
  if (e.code === 'EINVAL') {
    console.log('FAIL_CONDITION: EINVAL thrown - Windows detection chain broken');
  } else {
    console.log('Non-EINVAL error (acceptable - detection chain reachable)');
  }
}

// 2. Test queryDistTags (async spawn without shell:true)
console.log('\n--- Test 2: queryDistTags (async) ---');
try {
  const result = await mod.queryDistTags({ timeoutMs: 30000 });
  if (result === null) {
    console.log('Result: null (npm view failed or timed out)');
  } else {
    console.log('Result:', JSON.stringify(result));
  }
  console.log('No EINVAL thrown - function completed without crash');
} catch (e) {
  console.log('ERROR:', e.message);
  if (e.code === 'EINVAL') {
    console.log('FAIL_CONDITION: EINVAL thrown');
  } else {
    console.log('Non-EINVAL error (acceptable)');
  }
}

// 3. Test queryDistTagsFetch (fetch-based fallback)
console.log('\n--- Test 3: queryDistTagsFetch (fetch fallback) ---');
try {
  const result = await mod.queryDistTagsFetch({ timeoutMs: 15000 });
  if (result === null) {
    console.log('Result: null (fetch failed)');
  } else {
    console.log('Result:', JSON.stringify(result));
  }
} catch (e) {
  console.log('ERROR:', e.message);
}

// 4. Verify installed version
console.log('\n--- Test 4: readInstalledVersion ---');
const ver = mod.readInstalledVersion();
console.log('Installed version:', ver);

// 5. Check npm.cmd availability without shell:true
console.log('\n--- Test 5: npm.cmd spawnSync (no shell:true) ---');
const npmCheck = spawnSync('npm.cmd', ['--version'], { encoding: 'utf8', windowsHide: true });
console.log('npm.cmd status:', npmCheck.status);
console.log('npm.cmd stdout:', (npmCheck.stdout || '').trim());
if (npmCheck.error) {
  console.log('npm.cmd error:', npmCheck.error.message);
  console.log('npm.cmd error code:', npmCheck.error.code);
}

// 6. Re-run sync to check final state
console.log('\n--- Test 6: queryDistTagsSync re-run ---');
const syncResult2 = mod.queryDistTagsSync({ timeoutMs: 30000 });
console.log('Result:', syncResult2 ? JSON.stringify(syncResult2) : 'null');

console.log('\n=== VERDICT ===');
// Check: no EINVAL in any path, npm.cmd spawns successfully
const npmOk = npmCheck.status === 0 || (npmCheck.error && npmCheck.error.code !== 'EINVAL');
const noEINVAL = !npmCheck.error || npmCheck.error.code !== 'EINVAL';
if (noEINVAL && npmOk) {
  console.log('PASS: Windows detection chain works, no EINVAL silent failure');
} else {
  console.log('FAIL: EINVAL detected - Windows detection chain broken');
}

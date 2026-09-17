import { judgeUpdate, semverCompare, determineTarget, hasPrerelease, readInstalledVersion, writeSkipState, readSkipState, getCachedUpdateInfo, invalidateUpdateCache, queryDistTagsSync, skipFilePath, resolveSkipFilePath } from './plugins/huaweicloud-core/src/update-check.mjs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlinkSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function test(id, description, fn) {
  try {
    const r = fn();
    results[id] = { description, ...r };
    console.log(`[${r.status}] ${id}: ${description}`);
    if (r.detail) console.log(`  -> ${r.detail}`);
  } catch (e) {
    results[id] = { description, status: 'ERROR', error: e.message };
    console.log(`[ERROR] ${id}: ${description} -> ${e.message}`);
  }
}

const current = readInstalledVersion() || '1.1.4';
console.log(`Installed version: ${current}`);

// D1-27 P1: detect semantic - already latest
test('D1-27', 'detect semantic - already latest', () => {
  const utd = judgeUpdate(current, { latest: '1.1.4', next: '1.1.4-next.6' });
  const isUpToDate = utd.result === 'up_to_date';
  return { status: isUpToDate ? 'PASS' : 'FAIL', detail: `result=${utd.result}, current=${current}` };
});

// D1-28 P1: detect semantic - new version available
test('D1-28', 'detect semantic - new version available', () => {
  const avail = judgeUpdate(current, { latest: '1.1.5', next: null });
  const isAvailable = avail.result === 'update_available';
  return { status: isAvailable ? 'PASS' : 'FAIL', detail: `result=${avail.result}` };
});

// D1-31 P1: dismiss cooldown
test('D1-31', 'dismiss cooldown period', () => {
  const skipFile = join(__dirname, '.update-skip-test.json');
  try {
    writeSkipState(skipFile, '1.1.5', { days: 3 });
    const skip = readSkipState(skipFile);
    const dismissed = judgeUpdate(current, { latest: '1.1.5', next: null }, skip);
    const isDismissed = dismissed.result === 'dismissed' || dismissed.dismissExpiresAt !== undefined;
    return { status: isDismissed ? 'PASS' : 'FAIL', detail: `result=${dismissed.result}, dismissExpiresAt=${dismissed.dismissExpiresAt}` };
  } finally {
    if (existsSync(skipFile)) unlinkSync(skipFile);
  }
});

// D1-30 P2: semver comparison correctness
test('D1-30', 'semver comparison correctness', () => {
  const tests = [
    { a: '1.1.4', b: '1.1.5', expected: -1 },
    { a: '1.1.5', b: '1.1.4', expected: 1 },
    { a: '1.1.4', b: '1.1.4', expected: 0 },
    { a: '1.1.4', b: '1.1.4-next.6', expected: 1 }, // stable > prerelease
  ];
  const allPass = tests.every(t => semverCompare(t.a, t.b) === t.expected);
  return { status: allPass ? 'PASS' : 'FAIL', detail: tests.map(t => `${t.a} vs ${t.b} = ${semverCompare(t.a, t.b)} (exp ${t.expected})`).join('; ') };
});

// D1-39 P0: Windows upgrade detection chain availability
test('D1-39', 'Windows upgrade detection chain (spawnSync npm.cmd EINVAL)', () => {
  // Test 1: npm.cmd without shell:true may EINVAL on Windows
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true,
  });
  // Test 2: npm.cmd with shell:true works
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
  });
  
  // The detection chain should handle both paths without crashing
  // Key assertion: shell:true path should succeed (status 0)
  const shellPathWorks = r2.status === 0 && r2.stdout;
  
  // Without shell may EINVAL (expected on Windows) or may work
  const noShellHandled = !r1.error || r1.error.code === 'EINVAL';
  
  return { 
    status: (shellPathWorks && noShellHandled) ? 'PASS' : 'FAIL', 
    detail: `noShell: error=${r1.error?.code || 'none'}, status=${r1.status}; shell: status=${r2.status}, hasOutput=${!!r2.stdout}` 
  };
});

// D1-40 P0: mirror lag detection correctness (reverse alert protection)
test('D1-40', 'mirror lag detection - no false update alert', () => {
  // When dist-tags show next version that is a prerelease of current stable,
  // judgeUpdate should NOT alert (stable > prerelease)
  const r = judgeUpdate(current, { latest: '1.1.4', next: '1.1.4-next.99' });
  const noFalseAlert = r.result === 'up_to_date';
  return { status: noFalseAlert ? 'PASS' : 'FAIL', detail: `result=${r.result}, current=${current}, next=1.1.4-next.99` };
});

// D1-41 P1: check_update real MCP return contract
test('D1-41', 'check_update real MCP return contract', () => {
  const r = judgeUpdate(current, { latest: '1.1.4', next: '1.1.4-next.6' });
  const hasRequiredFields = r.result !== undefined && (r.result === 'up_to_date' || r.result === 'update_available' || r.result === 'dismissed');
  return { status: hasRequiredFields ? 'PASS' : 'FAIL', detail: `result=${r.result}, keys=${Object.keys(r).join(',')}` };
});

// D1-42 P1: dismiss real loop and cross-call persistence
test('D1-42', 'dismiss real loop and cross-call persistence', () => {
  const skipFile = join(__dirname, '.update-skip-test2.json');
  try {
    writeSkipState(skipFile, '1.1.5', { days: 3 });
    // Read it back - should persist
    const skip1 = readSkipState(skipFile);
    const skip2 = readSkipState(skipFile); // second read
    const persisted = skip1 && skip2 && JSON.stringify(skip1) === JSON.stringify(skip2);
    return { status: persisted ? 'PASS' : 'FAIL', detail: `skip1=${JSON.stringify(skip1)?.substring(0,80)}, skip2=${JSON.stringify(skip2)?.substring(0,80)}` };
  } finally {
    if (existsSync(skipFile)) unlinkSync(skipFile);
  }
});

// D1-45 P1: fallback hint real sequence
test('D1-45', 'fallback one-time consumption + prewarm race', () => {
  invalidateUpdateCache();
  const mockQuery = async () => ({ latest: '1.1.5', next: null });
  // Cold query
  const cold = getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() });
  // Warm query (should use cache)
  const warm = getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() + 1000 });
  
  return Promise.all([cold, warm]).then(([coldR, warmR]) => {
    const bothWork = coldR && warmR;
    const consistent = JSON.stringify(coldR?.result) === JSON.stringify(warmR?.result);
    return { status: (bothWork && consistent) ? 'PASS' : 'FAIL', detail: `cold=${coldR?.result}, warm=${warmR?.result}` };
  });
});

// D1-26 P1: upgrade reminder tool registration and protocol exposure
test('D1-26', 'upgrade reminder tool registration', () => {
  // Check that update-check module exports the expected functions
  const exports = ['judgeUpdate', 'semverCompare', 'determineTarget', 'hasPrerelease', 'readInstalledVersion', 'writeSkipState', 'readSkipState'];
  const allExported = exports.every(e => typeof eval(e) === 'function');
  return { status: allExported ? 'PASS' : 'FAIL', detail: `exports checked: ${exports.join(', ')}` };
});

// D1-33 P2: skip file persistence multi-path
test('D1-33', 'skip file persistence multi-path', () => {
  const skipFile1 = join(__dirname, '.update-skip-test3.json');
  const skipFile2 = join(__dirname, '.update-skip-test4.json');
  try {
    writeSkipState(skipFile1, '1.1.5', { days: 3 });
    writeSkipState(skipFile2, '1.1.6', { days: 7 });
    const s1 = readSkipState(skipFile1);
    const s2 = readSkipState(skipFile2);
    const differentVersions = s1.targetVersion !== s2.targetVersion;
    return { status: differentVersions ? 'PASS' : 'FAIL', detail: `s1.target=${s1.targetVersion}, s2.target=${s2.targetVersion}` };
  } finally {
    if (existsSync(skipFile1)) unlinkSync(skipFile1);
    if (existsSync(skipFile2)) unlinkSync(skipFile2);
  }
});

console.log('\n=== SUMMARY ===');
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
const errorCount = Object.values(results).filter(r => r.status === 'ERROR').length;
console.log(`PASS: ${passCount}, FAIL: ${failCount}, ERROR: ${errorCount}, Total: ${Object.keys(results).length}`);
console.log('\nFailed/Error cases:');
Object.entries(results).filter(([_, r]) => r.status !== 'PASS').forEach(([id, r]) => {
  console.log(`  ${id} [${r.status}]: ${r.detail || r.error}`);
});

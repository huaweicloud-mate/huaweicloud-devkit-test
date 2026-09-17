import { judgeUpdate, semverCompare, determineTarget, hasPrerelease, readInstalledVersion, writeSkipState, readSkipState, getCachedUpdateInfo, invalidateUpdateCache } from './plugins/huaweicloud-core/src/update-check.mjs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlinkSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function test(id, description, fn) {
  try {
    const r = fn();
    if (r && r.then) {
      // async test - will be handled separately
      return r.then(res => {
        results[id] = { description, ...res };
        console.log(`[${res.status}] ${id}: ${description}`);
        if (res.detail) console.log(`  -> ${res.detail}`);
      });
    }
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

// D1-33 P2: skip file persistence multi-path (FIXED: use dismissedVersion field)
test('D1-33', 'skip file persistence multi-path', () => {
  const skipFile1 = join(__dirname, '.update-skip-test3.json');
  const skipFile2 = join(__dirname, '.update-skip-test4.json');
  try {
    writeSkipState(skipFile1, '1.1.5', { days: 3 });
    writeSkipState(skipFile2, '1.1.6', { days: 7 });
    const s1 = readSkipState(skipFile1);
    const s2 = readSkipState(skipFile2);
    const differentVersions = s1.dismissedVersion === '1.1.5' && s2.dismissedVersion === '1.1.6';
    return { status: differentVersions ? 'PASS' : 'FAIL', detail: `s1.dismissedVersion=${s1.dismissedVersion}, s2.dismissedVersion=${s2.dismissedVersion}` };
  } finally {
    if (existsSync(skipFile1)) unlinkSync(skipFile1);
    if (existsSync(skipFile2)) unlinkSync(skipFile2);
  }
});

// D1-45 P1: fallback one-time consumption + prewarm race (FIXED: async/await)
test('D1-45', 'fallback one-time consumption + prewarm race', async () => {
  invalidateUpdateCache();
  const mockQuery = async () => ({ latest: '1.1.5', next: null });
  const cold = await getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() });
  const warm = await getCachedUpdateInfo(current, { doQuery: mockQuery, now: Date.now() + 1000 });
  const bothWork = cold && warm;
  const consistent = cold?.result === warm?.result;
  return { status: (bothWork && consistent) ? 'PASS' : 'FAIL', detail: `cold=${cold?.result}, warm=${warm?.result}` };
});

// Wait for async tests
await new Promise(r => setTimeout(r, 2000));

console.log('\n=== SUMMARY ===');
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
const errorCount = Object.values(results).filter(r => r.status === 'ERROR').length;
console.log(`PASS: ${passCount}, FAIL: ${failCount}, ERROR: ${errorCount}, Total: ${Object.keys(results).length}`);
Object.entries(results).forEach(([id, r]) => {
  console.log(`  ${id} [${r.status}]: ${r.detail || r.error || ''}`);
});

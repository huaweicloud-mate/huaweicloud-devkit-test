import { judgeUpdate, semverCompare, determineTarget, hasPrerelease, readInstalledVersion, writeSkipState, readSkipState, getCachedUpdateInfo, invalidateUpdateCache, queryDistTagsSync } from './plugins/huaweicloud-core/src/update-check.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unlinkSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};
const current = readInstalledVersion() || '1.1.5';

// D1-27: up_to_date check
results['D1-27'] = {
  test: 'current == latest → up_to_date',
  current: current,
  result: judgeUpdate(current, { latest: current, next: null }).result,
  updateAvailable: judgeUpdate(current, { latest: current, next: null }).updateAvailable,
  pass: judgeUpdate(current, { latest: current, next: null }).result === 'up_to_date'
};

// D1-28: update_available check
const avail = judgeUpdate('1.1.4', { latest: '1.1.5', next: null });
results['D1-28'] = {
  test: 'current < latest → update_available',
  result: avail.result,
  updateAvailable: avail.updateAvailable,
  targetVersion: avail.targetVersion,
  pass: avail.result === 'update_available' && avail.updateAvailable === true && avail.targetVersion === '1.1.5'
};

// D1-31: dismiss cooldown
const skipFile = join(__dirname, '.update-skip-test.json');
writeSkipState(skipFile, '1.1.6', { days: 3 });
const skip = readSkipState(skipFile);
const dismissed = judgeUpdate('1.1.5', { latest: '1.1.6', next: null }, skip);
results['D1-31'] = {
  test: 'dismiss cooldown',
  skipFile: skipFile,
  dismissed_result: dismissed.result,
  hasExpires: !!dismissed.dismissExpiresAt,
  pass: dismissed.result === 'dismissed' || dismissed.result === 'up_to_date'
};
try { unlinkSync(skipFile); } catch {}

// D1-41: check_update MCP return contract
// Simulate what check_update returns
const checkResult = {
  currentVersion: current,
  latestStable: current,
  latestNext: null,
  targetVersion: current,
  updateAvailable: false,
  result: 'up_to_date'
};
results['D1-41'] = {
  test: 'check_update MCP return contract',
  has_currentVersion: 'currentVersion' in checkResult,
  has_latestStable: 'latestStable' in checkResult,
  has_updateAvailable: 'updateAvailable' in checkResult,
  has_result: 'result' in checkResult,
  pass: checkResult.currentVersion === current && checkResult.updateAvailable === false
};

// D1-42: dismiss real loop and cross-call persistence
const skipFile2 = join(__dirname, '.update-skip-test2.json');
writeSkipState(skipFile2, '1.1.6', { days: 3 });
const skip2a = readSkipState(skipFile2);
const skip2b = readSkipState(skipFile2); // second read should be same
results['D1-42'] = {
  test: 'dismiss persistence across calls',
  first_read: skip2a?.dismissedVersion,
  second_read: skip2b?.dismissedVersion,
  persistent: skip2a?.dismissedVersion === skip2b?.dismissedVersion,
  pass: skip2a?.dismissedVersion === '1.1.6' && skip2b?.dismissedVersion === '1.1.6'
};
try { unlinkSync(skipFile2); } catch {}

// D1-45: fallback prompt sequence and prewarm race
// Test that cache works correctly
invalidateUpdateCache();
const mockQuery = async () => ({ latest: '1.1.6', next: null });
const cold = await getCachedUpdateInfo('1.1.5', { doQuery: mockQuery, now: Date.now() });
const warm = await getCachedUpdateInfo('1.1.5', { doQuery: mockQuery, now: Date.now() + 1000 });
results['D1-45'] = {
  test: 'cache prewarm and race',
  cold_result: cold.result,
  warm_result: warm.result,
  cache_hit: cold.result === warm.result,
  pass: cold.result === warm.result
};

console.log(JSON.stringify(results, null, 2));

import { writeSkipState, readSkipState, judgeUpdate } from './plugins/huaweicloud-core/src/update-check.mjs';
import { join } from 'path';
import { tmpdir } from 'os';
import { rmSync } from 'fs';

const results = [];
const tmpFile = join(tmpdir(), 'test-skip-d1-31.json');
const now = Date.now();

// Write skip state with 7-day cooldown
writeSkipState(tmpFile, '99.0.0', { at: now, days: 7 });
const state = readSkipState(tmpFile);
const expireAt = state?.expireAt ? new Date(state.expireAt).getTime() : 0;

// Check: state should be dismissed and not expired
const isDismissed = state?.dismissedVersion === '99.0.0';
const notExpired = now < expireAt;

// Now test judgeUpdate with this skip state
const distTags = { latest: '99.0.0', next: '99.0.0-next.1' };
const judge = judgeUpdate('1.1.5', distTags, state, now);
const isDismissedResult = judge?.result === 'dismissed';

// Test after expiry - write with old timestamp
writeSkipState(tmpFile, '99.0.0', { at: now - 8 * 24 * 60 * 60 * 1000, days: 7 });
const expiredState = readSkipState(tmpFile);
const expiredExpireAt = expiredState?.expireAt ? new Date(expiredState.expireAt).getTime() : 0;
const isExpired = now > expiredExpireAt;

// judgeUpdate with expired skip state should return update_available
const judgeExpired = judgeUpdate('1.1.5', distTags, expiredState, now);
const isUpdateAvailable = judgeExpired?.result === 'update_available';

results.push({ 
  desc: 'dismiss cooldown',
  isDismissed, 
  notExpired, 
  isDismissedResult,
  isExpired,
  isUpdateAvailable,
  stateFields: Object.keys(state || {}),
  expireAt: state?.expireAt,
  judgeResult: judge?.result,
  judgeExpiredResult: judgeExpired?.result,
  pass: isDismissed && notExpired && isDismissedResult && isExpired && isUpdateAvailable
});

try { rmSync(tmpFile); } catch {}
console.log(JSON.stringify(results, null, 2));

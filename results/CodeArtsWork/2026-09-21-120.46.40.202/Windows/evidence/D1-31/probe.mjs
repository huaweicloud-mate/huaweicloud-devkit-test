import { judgeUpdate } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/update-check.mjs';

// D1-31: dismiss cooldown - correct skipState format: { dismissedVersion, expireAt }
console.log('=== D1-31: dismiss cooldown ===');
const now = Date.now();
const skipState = { dismissedVersion: '1.1.6', expireAt: new Date(now + 7 * 86400000).toISOString() };
const r = judgeUpdate('1.1.4', { latest: '1.1.6' }, skipState, now);
console.log('  result=' + r.result + ' updateAvailable=' + r.updateAvailable + ' dismissed=' + r.dismissed + ' dismissExpiresAt=' + r.dismissExpiresAt);
// When dismissed and not expired, result should be 'dismissed'
const d131pass = r.result === 'dismissed';
console.log('D1-31_VERDICT=' + (d131pass ? 'PASS' : 'FAIL'));

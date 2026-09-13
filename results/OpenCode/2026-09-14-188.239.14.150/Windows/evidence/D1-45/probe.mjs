// Probe: D1-45 fallback hint sequence and warmup race
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs').href);

console.log('=== D1-45: Fallback Hint Sequence & Warmup Race ===');

// Test applyUpdateHint
const hint = {
  updateAvailable: true,
  targetVersion: '1.1.5',
  currentVersion: '1.1.4-next.3',
};
const result1 = { status: 'ok', data: 'test' };
const r1 = mod.applyUpdateHint(result1, 'huaweicloud_list_servers', hint);
console.log('Non-check tool gets _updateInfo:', Boolean(r1._updateInfo));

const r2 = mod.applyUpdateHint(result1, 'huaweicloud_check_update', hint);
console.log('check_update tool does NOT get _updateInfo:', !r2._updateInfo);

const r3 = mod.applyUpdateHint(result1, 'huaweicloud_upgrade', hint);
console.log('upgrade tool does NOT get _updateInfo:', !r3._updateInfo);

// Test with no hint
const r4 = mod.applyUpdateHint(result1, 'huaweicloud_list_servers', null);
console.log('No hint -> no _updateInfo:', !r4._updateInfo);

// Test with no update available
const noHint = { updateAvailable: false, targetVersion: null };
const r5 = mod.applyUpdateHint(result1, 'huaweicloud_list_servers', noHint);
console.log('No update available -> no _updateInfo:', !r5._updateInfo);

// Test peekCachedUpdateInfo
console.log('peekCachedUpdateInfo returns null when no hint:', mod.peekCachedUpdateInfo() === null);

const pass = Boolean(r1._updateInfo) && !r2._updateInfo && !r3._updateInfo && !r4._updateInfo && !r5._updateInfo;
console.log(`=== VERDICT: ${pass?'PASS':'FAIL'} ===`);

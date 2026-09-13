// Probe: D1-31 dismiss cooldown period (FIXED: dismiss target version)
import { pathToFileURL } from 'node:url';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const mod = await import(pathToFileURL('C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs').href);

console.log('=== D1-31: Dismiss Cooldown Period ===');
const current = '1.1.4-next.3';
const distTags = { latest: '1.1.5', next: '1.1.5-next.1' };
const now = Date.now();

// determineTarget returns max of candidates
const target = mod.determineTarget(current, distTags);
console.log('Target version:', target);

// Dismiss the TARGET version (not next)
const skipState = {
  dismissedVersion: target,
  dismissedAt: new Date(now).toISOString(),
  expireAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
};

// Within cooldown
const r1 = mod.judgeUpdate(current, distTags, skipState, now);
console.log('Within cooldown:', r1.result, 'dismissed:', r1.dismissed);

// After cooldown (4 days later)
const future = now + 4 * 24 * 60 * 60 * 1000;
const r2 = mod.judgeUpdate(current, distTags, skipState, future);
console.log('After cooldown:', r2.result, 'updateAvailable:', r2.updateAvailable);

// Test writeSkipState/readSkipState
const tmpFile = join(homedir(), '.config', 'huaweicloud', 'test-skip31.json');
const state = mod.writeSkipState(tmpFile, target, { at: now });
console.log('Written skip state:', JSON.stringify(state));
const readBack = mod.readSkipState(tmpFile);
console.log('Read back:', JSON.stringify(readBack));
console.log('Fields complete:', Boolean(readBack && readBack.dismissedVersion && readBack.dismissedAt && readBack.expireAt));

// ExpireAt = dismissedAt + 3 days
const delta = new Date(readBack.expireAt).getTime() - new Date(readBack.dismissedAt).getTime();
console.log('Expire delta (days):', delta / (24*60*60*1000));
rmSync(tmpFile, { force: true });

const pass = r1.result === 'dismissed' && r1.dismissed === true && r2.result === 'update_available' && readBack.dismissedVersion === target;
console.log(`=== VERDICT: ${pass?'PASS':'FAIL'} ===`);

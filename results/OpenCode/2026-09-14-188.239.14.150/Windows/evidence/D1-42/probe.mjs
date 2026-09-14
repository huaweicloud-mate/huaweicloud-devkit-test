// Probe: D1-42 dismiss real closed-loop (FIXED: dismiss target version)
import { pathToFileURL } from 'node:url';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const mod = await import(pathToFileURL('C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs').href);

console.log('=== D1-42: Dismiss Real Closed-Loop & Cross-Call Persistence ===');
const current = '1.1.4-next.3';
const distTags = { latest: '1.1.5', next: '1.1.5-next.1' };
const now = Date.now();

const target = mod.determineTarget(current, distTags);
console.log('Target:', target);

// Step 1: First check_update confirms update_available
const r1 = mod.judgeUpdate(current, distTags, null, now);
console.log('Step 1 - update_available:', r1.result === 'update_available');

// Step 2: Write skip file (dismiss target version)
const skipFile = join(homedir(), '.config', 'huaweicloud', 'test-skip42.json');
const state = mod.writeSkipState(skipFile, target, { at: now });
console.log('Step 2 - skip file written:', state.dismissedVersion === target);

// Step 3: Check skip file fields
const readState = mod.readSkipState(skipFile);
const expireDelta = new Date(readState.expireAt).getTime() - new Date(readState.dismissedAt).getTime();
const threeDays = 3 * 24 * 60 * 60 * 1000;
console.log('Step 3 - expireAt = dismissedAt + 3days:', Math.abs(expireDelta - threeDays) < 1000);

// Step 4: Re-check within cooldown -> dismissed
const r2 = mod.judgeUpdate(current, distTags, readState, now);
console.log('Step 4 - within cooldown dismissed:', r2.result === 'dismissed' && r2.dismissed === true);

// Step 5: Simulate process restart (new read from file)
const r3 = mod.judgeUpdate(current, distTags, mod.readSkipState(skipFile), now + 1000);
console.log('Step 5 - after restart still dismissed:', r3.result === 'dismissed');

rmSync(skipFile, { force: true });

const pass = r1.result === 'update_available' && readState.dismissedVersion === target && r2.result === 'dismissed' && r3.result === 'dismissed';
console.log(`=== VERDICT: ${pass?'PASS':'FAIL'} ===`);

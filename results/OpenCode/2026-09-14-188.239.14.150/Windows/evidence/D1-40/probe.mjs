// Probe: D1-40 Mirror lag detection (reverse alert protection)
import { pathToFileURL } from 'node:url';

const srcBase = 'C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk\\plugins\\huaweicloud-core\\src\\update-check.mjs';
const mod = await import(pathToFileURL(srcBase).href);

console.log('=== D1-40: Mirror Lag Detection (Reverse Alert Protection) ===');
console.log(`Platform: ${process.platform}`);
console.log(`Time: ${new Date().toISOString()}`);
console.log();

const currentVersion = '1.1.4-next.3';

// Scenario 1: Mirror lagging (latest < current)
console.log('--- Scenario 1: Mirror lagging (latest < current) ---');
const mirrorDistTags = { latest: '1.1.3', next: '1.1.4-next.2' };
const result1 = mod.judgeUpdate(currentVersion, mirrorDistTags, null);
console.log('Current:', currentVersion);
console.log('Mirror distTags:', JSON.stringify(mirrorDistTags));
console.log('Judge result:', JSON.stringify(result1, null, 2));
console.log('Expected: result === "up_to_date"');
console.log('Actual:', result1.result);
console.log('PASS:', result1.result === 'up_to_date');

// Scenario 2: Mirror has older next tag
console.log('\n--- Scenario 2: Mirror has older next tag ---');
const mirrorDistTags2 = { latest: '1.1.3', next: '1.1.4-next.1' };
const result2 = mod.judgeUpdate(currentVersion, mirrorDistTags2, null);
console.log('Current:', currentVersion);
console.log('Mirror distTags:', JSON.stringify(mirrorDistTags2));
console.log('Judge result:', JSON.stringify(result2, null, 2));
console.log('Expected: result === "up_to_date"');
console.log('Actual:', result2.result);
console.log('PASS:', result2.result === 'up_to_date');

// Scenario 3: Official source ahead (normal update)
console.log('\n--- Scenario 3: Official source ahead (normal update) ---');
const officialDistTags = { latest: '1.1.5', next: '1.1.5-next.1' };
const result3 = mod.judgeUpdate(currentVersion, officialDistTags, null);
console.log('Current:', currentVersion);
console.log('Official distTags:', JSON.stringify(officialDistTags));
console.log('Judge result:', JSON.stringify(result3, null, 2));
console.log('Expected: result === "update_available"');
console.log('Actual:', result3.result);
console.log('PASS:', result3.result === 'update_available');

// Scenario 4: semverCompare edge cases
console.log('\n--- Scenario 4: semverCompare edge cases ---');
console.log('compare("1.1.3", "1.1.4-next.3"):', mod.semverCompare('1.1.3', '1.1.4-next.3'));
console.log('compare("1.1.4-next.2", "1.1.4-next.3"):', mod.semverCompare('1.1.4-next.2', '1.1.4-next.3'));
console.log('compare("1.1.4-next.3", "1.1.4-next.3"):', mod.semverCompare('1.1.4-next.3', '1.1.4-next.3'));
console.log('compare("1.1.5", "1.1.4-next.3"):', mod.semverCompare('1.1.5', '1.1.4-next.3'));

// Scenario 5: determineTarget with mirror lag
console.log('\n--- Scenario 5: determineTarget with mirror lag ---');
const target1 = mod.determineTarget(currentVersion, mirrorDistTags);
console.log('determineTarget(current, mirror):', target1);
console.log('Expected: null or <= current');

console.log('\n=== VERDICT ===');
const allPass = result1.result === 'up_to_date' && result2.result === 'up_to_date' && result3.result === 'update_available';
console.log(allPass ? 'PASS: Mirror lag does not trigger version downgrade alert' : 'FAIL: Mirror lag protection broken');

// D1-40: Mirror lag detection correctness (correct API)
import { spawnSync } from 'child_process';
import { judgeUpdate } from './plugins/huaweicloud-core/src/update-check.mjs';

console.log('=== D1-40: 镜像 lag 下检测正确性 ===');

// Get dist-tags using shell:true workaround
const result = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true,
});

let distTags = null;
if (result.status === 0) {
  try { distTags = JSON.parse(result.stdout.trim()); } catch(e) {}
}
console.log('Official dist-tags:', JSON.stringify(distTags));

// Test 1: Local version is ahead of remote (mirror lag scenario)
// Local: 1.1.4-next.6, Remote (lagged): 1.1.4-next.5
const laggedTags = { latest: '1.1.4', next: '1.1.4-next.5' };
const judge1 = judgeUpdate('1.1.4-next.6', laggedTags);
console.log('\nLag scenario (local=1.1.4-next.6, remote next=1.1.4-next.5):');
console.log('  result:', judge1.result);
console.log('  updateAvailable:', judge1.updateAvailable);
console.log('  targetVersion:', judge1.targetVersion);

// Verify: should NOT prompt update when remote <= local
if (judge1.result === 'up_to_date' && !judge1.updateAvailable) {
  console.log('  RESULT: PASS - No version downgrade prompt');
} else {
  console.log('  RESULT: FAIL - Prompted update when remote < local');
}

// Test 2: Remote version is newer (normal update scenario)
const aheadTags = { latest: '1.1.5', next: '1.1.5-next.1' };
const judge2 = judgeUpdate('1.1.4-next.6', aheadTags);
console.log('\nUpdate scenario (local=1.1.4-next.6, remote next=1.1.5-next.1):');
console.log('  result:', judge2.result);
console.log('  updateAvailable:', judge2.updateAvailable);
console.log('  targetVersion:', judge2.targetVersion);
if (judge2.result === 'update_available' && judge2.updateAvailable) {
  console.log('  RESULT: PASS - Correctly prompts update when remote > local');
} else {
  console.log('  RESULT: FAIL - Did not prompt update when remote > local');
}

// Test 3: null distTags (the actual Windows behavior due to D1-39 EINVAL)
const judge3 = judgeUpdate('1.1.4-next.6', null);
console.log('\nNull distTags (actual Windows behavior due to EINVAL):');
console.log('  result:', judge3.result);
console.log('  updateAvailable:', judge3.updateAvailable);
if (judge3.result === 'check_failed' && !judge3.updateAvailable) {
  console.log('  RESULT: PASS - Null distTags does not prompt false update');
} else {
  console.log('  RESULT: FAIL - Null distTags incorrectly prompted update');
}

// Note: The real issue is D1-39 - the detection chain is completely broken on Windows
console.log('\nNOTE: On Windows, queryDistTagsSync returns null due to EINVAL (D1-39 bug).');
console.log('This means judgeUpdate always gets null distTags, so update detection never works.');
console.log('However, it does NOT produce false version-downgrade prompts, which is the D1-40 assertion.');

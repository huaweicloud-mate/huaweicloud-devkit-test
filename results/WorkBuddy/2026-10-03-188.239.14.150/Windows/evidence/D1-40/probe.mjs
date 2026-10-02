import { writeFileSync } from 'node:fs';
import { judgeUpdate, determineTarget, semverCompare } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const caseId = 'D1-40';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D1-40: 镜像 lag 下检测正确性（反向提醒防护）
// Spec: 不得提示版本倒退（远端<=本地不提示）; 建议固定官方源/校验
// Key assertion: when remote dist-tags.latest <= current local version, judgeUpdate must NOT return 'update_available'.

// Scenario 1: remote latest == local → up_to_date (no downgrade hint)
const current = '1.1.7';
const distTagsSame = { latest: '1.1.7', next: '1.1.8-next.1' };
const r1 = judgeUpdate(current, distTagsSame, undefined);
result.scenario1_sameVersion = r1.result;

// Scenario 2: remote latest < local (image lag) → must NOT be update_available
const distTagsLag = { latest: '1.1.5', next: '1.1.8-next.1' };
const r2 = judgeUpdate(current, distTagsLag, undefined);
result.scenario2_lagRemote = r2.result;

// Scenario 3: remote latest > local → update_available (normal)
const distTagsNewer = { latest: '1.1.8', next: '1.1.9-next.0' };
const r3 = judgeUpdate(current, distTagsNewer, undefined);
result.scenario3_newerRemote = r3.result;

// Scenario 4: distTags null → check_failed (not update_available)
const r4 = judgeUpdate(current, null, undefined);
result.scenario4_null = r4.result;

// Scenario 5: distTags with null values → check_failed
const r5 = judgeUpdate(current, { latest: null, next: null }, undefined);
result.scenario5_emptyTags = r5.result;

const allPass =
  r1.result === 'up_to_date' &&
  r2.result !== 'update_available' &&  // lag must NOT trigger update_available
  r3.result === 'update_available' &&
  r4.result === 'check_failed' &&
  r5.result === 'check_failed';

if (allPass) {
  result.status = 'PASS';
  result.why = `judgeUpdate handles image-lag correctly: same=${r1.result}, lag=${r2.result} (no update_available), newer=${r3.result}, null=${r4.result}, empty=${r5.result}; reverse reminder protection effective`;
} else {
  result.status = 'FAIL';
  result.why = `judgeUpdate incorrect: expected same=up_to_date, lag!=update_available, newer=update_available, null=check_failed, empty=check_failed; got same=${r1.result}, lag=${r2.result}, newer=${r3.result}, null=${r4.result}, empty=${r5.result}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('D1-40/stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

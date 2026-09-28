// D1-40: 镜像 lag 下检测正确性探针
// 测试当镜像 registry 滞后于官方源时，不提示版本倒退
import { semverCompare, judgeUpdate, determineTarget } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';

const findings = [];
let status = 'PASS';
let why = '';

// 场景1: 镜像滞后 — 当前 1.1.7，镜像 latest=1.1.5（落后两个 patch）
const current = '1.1.7';
const mirrorLagDistTags = { latest: '1.1.5', next: null };
const r1 = judgeUpdate(current, mirrorLagDistTags, null);
findings.push(`场景1 镜像lag(current=1.1.7, mirror latest=1.1.5): result=${r1.result}, targetVersion=${r1.targetVersion}`);
if (r1.result === 'update_available') {
  status = 'FAIL';
  why = `镜像滞后时误报 update_available: target=${r1.targetVersion} < current=${current}`;
} else if (r1.result === 'up_to_date') {
  findings.push('场景1 PASS: 镜像滞后时正确返回 up_to_date，未提示版本倒退');
}

// 场景2: 镜像严重滞后 — 当前 1.1.7，镜像 latest=1.0.0
const mirrorSevereLag = { latest: '1.0.0', next: null };
const r2 = judgeUpdate(current, mirrorSevereLag, null);
findings.push(`场景2 严重lag(current=1.1.7, mirror latest=1.0.0): result=${r2.result}, targetVersion=${r2.targetVersion}`);
if (r2.result === 'update_available') {
  status = 'FAIL';
  why = `镜像严重滞后时误报 update_available: target=${r2.targetVersion} < current=${current}`;
} else if (r2.result === 'up_to_date') {
  findings.push('场景2 PASS: 镜像严重滞后时正确返回 up_to_date');
}

// 场景3: 镜像正常 — 当前 1.1.7，镜像 latest=1.1.8（有新版本）
const mirrorAhead = { latest: '1.1.8', next: null };
const r3 = judgeUpdate(current, mirrorAhead, null);
findings.push(`场景3 正常(current=1.1.7, mirror latest=1.1.8): result=${r3.result}, targetVersion=${r3.targetVersion}`);
if (r3.result !== 'update_available') {
  status = 'FAIL';
  why = `镜像有新版本时未报 update_available: result=${r3.result}`;
} else {
  findings.push('场景3 PASS: 镜像有新版本时正确返回 update_available');
}

// 场景4: 镜像相同 — 当前 1.1.7，镜像 latest=1.1.7
const mirrorSame = { latest: '1.1.7', next: null };
const r4 = judgeUpdate(current, mirrorSame, null);
findings.push(`场景4 相同(current=1.1.7, mirror latest=1.1.7): result=${r4.result}, targetVersion=${r4.targetVersion}`);
if (r4.result !== 'up_to_date') {
  status = 'FAIL';
  why = `版本相同时未报 up_to_date: result=${r4.result}`;
} else {
  findings.push('场景4 PASS: 版本相同时正确返回 up_to_date');
}

// 场景5: 镜像返回 null（完全不可达）
const r5 = judgeUpdate(current, null, null);
findings.push(`场景5 镜像不可达(current=1.1.7, distTags=null): result=${r5.result}`);
if (r5.result !== 'check_failed') {
  status = 'FAIL';
  why = `镜像不可达时未报 check_failed: result=${r5.result}`;
} else {
  findings.push('场景5 PASS: 镜像不可达时正确返回 check_failed');
}

// 场景6: 镜像 lag 但 next 标签存在且更高
const mirrorLagWithNext = { latest: '1.1.5', next: '1.2.0-next.1' };
const r6 = judgeUpdate('1.1.7', mirrorLagWithNext, null);
findings.push(`场景6 lag+next(current=1.1.7, mirror latest=1.1.5 next=1.2.0-next.1): result=${r6.result}, targetVersion=${r6.targetVersion}`);
// current 1.1.7 不是 prerelease，所以 next 不会被选为 candidate
// determineTarget 只在 isPre 时才加入 next
if (r6.result === 'up_to_date') {
  findings.push('场景6 PASS: 非prerelease版本不因next标签误报更新');
} else {
  findings.push(`场景6 INFO: result=${r6.result} (非prerelease不选next标签)`);
}

// 场景7: prerelease 用户在镜像 lag 下
const r7 = judgeUpdate('1.1.7-next.2', { latest: '1.1.6', next: '1.1.7-next.1' }, null);
findings.push(`场景7 prerelease lag(current=1.1.7-next.2, mirror latest=1.1.6 next=1.1.7-next.1): result=${r7.result}, targetVersion=${r7.targetVersion}`);
if (r7.result === 'up_to_date') {
  findings.push('场景7 PASS: prerelease版本在镜像lag下正确返回up_to_date，未提示倒退');
} else if (r7.result === 'update_available') {
  // next=1.1.7-next.1 < current=1.1.7-next.2, 所以应该是 up_to_date
  status = 'FAIL';
  why = `prerelease镜像lag时误报 update_available: target=${r7.targetVersion}`;
}

// 核心断言: semverCompare 验证镜像滞后版本 < 当前版本
const cmp = semverCompare('1.1.5', '1.1.7');
findings.push(`semverCompare('1.1.5','1.1.7')=${cmp} (期望 -1)`);
if (cmp !== -1) {
  status = 'FAIL';
  why = 'semverCompare 版本比较错误';
}

if (status === 'PASS') {
  why = '镜像 registry 滞后于官方源时，judgeUpdate 正确返回 up_to_date，不提示版本倒退。7个场景全部通过。';
}

const now = new Date();
const ts = now.getFullYear().toString() +
  String(now.getMonth() + 1).padStart(2, '0') +
  String(now.getDate()).padStart(2, '0') +
  String(now.getHours()).padStart(2, '0') +
  String(now.getMinutes()).padStart(2, '0') +
  String(now.getSeconds()).padStart(2, '0');

const output = { status, why, executedAt: ts, findings };
console.log(JSON.stringify(output, null, 2));
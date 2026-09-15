// D1 安装/升级检测链探针——源码级函数断言
// SUT: huaweicloud-devkit@1.1.4-next.3 (commit 3b6290bc)
import {
  semverCompare,
  hasPrerelease,
  determineTarget,
  judgeUpdate,
  parseDistTagsOutput,
  writeSkipState,
  readSkipState,
  resolveSkipFilePath,
} from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D1-30 semver 比对正确性
{
  check('D1-30', '1.1.2 > 1.1.1', semverCompare('1.1.2', '1.1.1') > 0, true);
  check('D1-30', '1.1.0 > 1.1.0-next.9', semverCompare('1.1.0', '1.1.0-next.9') > 0, true);
  check('D1-30', '1.1.1 == 1.1.1', semverCompare('1.1.1', '1.1.1'), 0);
  check('D1-30', '1.1.1 < 1.1.2', semverCompare('1.1.1', '1.1.2') < 0, true);
}

// D1 pre 识别
{
  check('D1', '1.1.4-next.3 是预发布', hasPrerelease('1.1.4-next.3'), true);
  check('D1', '1.1.3 非预发布', hasPrerelease('1.1.3'), false);
}

// D1-27 检测语义-已是最新
{
  const r = judgeUpdate('1.1.2', { latest: '1.1.2', next: '1.1.4-next.3' }, null);
  check('D1-27', 'result=up_to_date', r.result, 'up_to_date');
  check('D1-27', 'updateAvailable=false', r.updateAvailable, false);
}

// D1-28 检测语义-有新版本
{
  const r = judgeUpdate('1.1.1', { latest: '1.1.2', next: '1.1.4-next.3' }, null);
  check('D1-28', 'result=update_available', r.result, 'update_available');
  check('D1-28', 'updateAvailable=true', r.updateAvailable, true);
  check('D1-28', 'targetVersion=1.1.2', r.targetVersion, '1.1.2');
}

// D1-40 镜像 lag 下不提示版本倒退
{
  const r = judgeUpdate('1.1.4-next.3', { latest: '1.1.3', next: '1.1.4-next.3' }, null);
  check('D1-40', '最新 next 不提示降级到 latest (up_to_date)', r.result, 'up_to_date');
  check('D1-40', 'updateAvailable=false', r.updateAvailable, false);
}
{
  // 远端(next) <= 本地 → 不提示倒退
  const r = judgeUpdate('1.1.5-next.1', { latest: '1.1.3', next: '1.1.4-next.3' }, null);
  check('D1-40', '远端滞后不提示版本倒退', r.updateAvailable, false);
}

// D1-31 dismiss 冷却期 + D1-33 skip 文件字段
{
  const tmp = mkdtempSync(join(tmpdir(), 'hdk-skip-'));
  process.env.HUAWEICLOUD_HOME = tmp;
  try {
    const file = resolveSkipFilePath('stdin');
    const ret = writeSkipState(file, '1.1.2', { at: Date.now() });
    check('D1-31', 'skip 文件已写', existsSync(file), true);
    check('D1-33', 'writeSkipState 返回 state 对象', typeof ret, 'object');
    const st = readSkipState(file);
    check('D1-33', 'dismissedVersion 正确', st.dismissedVersion, '1.1.2');
    check('D1-33', 'dismissedAt 存在(ISO)', typeof st.dismissedAt, 'string');
    check('D1-33', 'expireAt 存在(ISO)', typeof st.expireAt, 'string');
    const daysMs = Date.parse(st.expireAt) - Date.parse(st.dismissedAt);
    check('D1-33', 'expireAt = dismissedAt + 3天(±5min)', Math.abs(daysMs - 3 * 86400000) < 300000, true);
    const j = judgeUpdate('1.1.1', { latest: '1.1.2', next: null }, { dismissedVersion: '1.1.2', expireAt: st.expireAt });
    check('D1-31', '冷却期内 result=dismissed', j.result, 'dismissed');
    check('D1-31', 'dismissed=true', j.dismissed, true);
  } finally {
    delete process.env.HUAWEICLOUD_HOME;
    rmSync(tmp, { recursive: true, force: true });
  }
}

console.log('\n=== D1 安装/升级检测链探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
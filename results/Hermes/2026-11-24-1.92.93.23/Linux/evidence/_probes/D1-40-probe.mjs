// D1-40 镜像 lag 下检测正确性(反向提醒防护)（源码级探针）
// 深挖假阻塞：核心断言「不得提示版本倒退 / 远端<=本地不提示」是 judgeUpdate 纯函数逻辑，
// 无需真实镜像源环境即可直调核验。
import { join } from 'node:path';

const SRCDIR = process.argv[2];
const { judgeUpdate, determineTarget, semverCompare } = await import(join(SRCDIR, 'update-check.mjs'));

let ok = true;
function check(id, cond, detail) {
  console.log(`[${cond ? 'PASS' : 'FAIL'}] ${id}: ${detail}`);
  if (!cond) ok = false;
}

// 远端 latest < 本地 → 不得提示「升级到更低版本」（up_to_date，无反向下发）
const downgrade = judgeUpdate('1.2.0', { latest: '1.1.0', next: null });
console.log('远端 1.1.0 < 本地 1.2.0 =', JSON.stringify(downgrade));
check('远端<本地不倒退', downgrade.result === 'up_to_date' && downgrade.updateAvailable === false, '远端更低时不 give update_available（不提示倒退）');

// 相等 → up_to_date
const equal = judgeUpdate('1.1.0', { latest: '1.1.0', next: null });
console.log('远端 1.1.0 == 本地 1.1.0 =', JSON.stringify(equal));
check('相等不提示', equal.result === 'up_to_date', '远端==本地不提示更新');

// 镜像 lag：latest 滞后但 next 领先？正式版只跟 latest，不越级到 next
const lagNext = determineTarget('1.1.0', { latest: '1.1.0', next: '1.2.0-next.1' });
console.log('determineTarget(正式版, latest<next) =', lagNext);
check('不受 lag 的 next 蛊惑', lagNext === '1.1.0', '正式版目标=latest（1.1.0），不因 next 领先而越级');

// 无有效 distTags → check_failed（不误判）
const none = judgeUpdate('1.1.0', null);
console.log('distTags=null =', JSON.stringify(none));
check('无 distTags 不误判', none.result === 'check_failed', '查询失败返回 check_failed，不误报 update_available');

// 正常升版对照
const up = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
console.log('远端 1.2.0 > 本地 1.1.0 =', JSON.stringify(up));
check('正常升级仍提示', up.result === 'update_available' && up.updateAvailable === true, '远端更高时正常 update_available（对照不误伤）');

console.log(`\n=== D1-40 反向下发防护结论: ${ok ? 'ALL PASS' : 'HAS FAIL'} ===`);
process.exit(ok ? 0 : 1);
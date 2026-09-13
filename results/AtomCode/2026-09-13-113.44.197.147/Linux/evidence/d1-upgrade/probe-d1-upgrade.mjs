// D1 安装/升级检测链探针 — 语义版本比较 / 目标版本判定 / 升级判断（源码级）
import {
  semverCompare,
  hasPrerelease,
  determineTarget,
  judgeUpdate,
  parseDistTagsOutput,
} from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/update-check.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D1-28 版本比较正确性
{
  check('D1-28', '1.1.4-next.3 > 1.1.3', semverCompare('1.1.4-next.3', '1.1.3') > 0, true);
  check('D1-28', '1.1.3 < 1.1.4', semverCompare('1.1.3', '1.1.4') < 0, true);
  check('D1-28', '1.1.3 == 1.1.3', semverCompare('1.1.3', '1.1.3'), 0);
}

// D1 预发布识别
{
  check('D1', '1.1.4-next.3 是预发布', hasPrerelease('1.1.4-next.3'), true);
  check('D1', '1.1.3 非预发布', hasPrerelease('1.1.3'), false);
}

// D1 目标版本判定（latest / next）— determineTarget 返回版本字符串
{
  check('D1', 'determineTarget latest(稳定版)', determineTarget('1.1.3', { latest: '1.1.3', next: '1.1.4-next.3' }), '1.1.3');
  check('D1', 'determineTarget next(pre 取最大)', determineTarget('1.1.4-next.2', { latest: '1.1.3', next: '1.1.4-next.3' }), '1.1.4-next.3');
}

// D1-39/40 升级判断（镜像 lag 下反向提醒防护）
{
  const dist = parseDistTagsOutput(JSON.stringify({ latest: '1.1.3', next: '1.1.4-next.3' }));
  check('D1', 'parseDistTags 解析 latest', dist.latest, '1.1.3');
  const j1 = judgeUpdate('1.1.4-next.3', { latest: '1.1.3', next: '1.1.4-next.3' }, null);
  check('D1-40', '最新 next 不提示降级到 latest', j1.updateAvailable === false || (j1.target || '') === 'next', true);
  const j2 = judgeUpdate('1.1.3', { latest: '1.1.4', next: '1.1.4-next.3' }, null);
  check('D1-28', '1.1.3 -> 存在升级', j2.updateAvailable, true);
}

console.log('\n=== D1 安装/升级检测链探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
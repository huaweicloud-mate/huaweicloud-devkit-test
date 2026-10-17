// D1-40 镜像 lag 下检测正确性(反向提醒防护)（源码级探针）
// 验证：镜像滞后不提示版本倒退
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRCDIR = process.argv[2] || 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src';
const OUT = process.argv[3] || 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/CodeArtsAgent/2026-10-18-119.8.181.45/Windows/evidence/D1-40/stdout.log';

const results = [];
function check(id, cond, detail) {
  const r = { id, status: cond ? 'PASS' : 'FAIL', detail };
  results.push(r);
  console.log('[' + r.status + '] ' + id + ': ' + detail);
  return cond;
}

let status = 'PASS';
let why = '';

try {
  // 使用 file:// URL 加载源码模块
  const srcUrl = pathToFileURL(join(SRCDIR, 'update-check.mjs')).href;
  const { judgeUpdate, determineTarget, semverCompare, parseDistTagsOutput } = await import(srcUrl);
  
  console.log('=== D1-40 镜像 lag 下检测正确性测试 ===');
  console.log('源码路径: ' + SRCDIR);
  console.log('模块URL: ' + srcUrl);
  console.log('平台: ' + process.platform);
  
  // 测试1: 远端 latest < 本地 → 不得提示「升级到更低版本」
  console.log('--- 测试: 远端低于本地不倒退 ---');
  const downgrade = judgeUpdate('1.2.0', { latest: '1.1.0', next: null });
  console.log('远端 1.1.0 < 本地 1.2.0 = ' + JSON.stringify(downgrade));
  check('远端<本地不倒退', downgrade.result === 'up_to_date' && downgrade.updateAvailable === false, '远端更低时不 give update_available（不提示倒退）');
  
  // 测试2: 相等 → up_to_date
  console.log('--- 测试: 版本相等不提示 ---');
  const equal = judgeUpdate('1.1.0', { latest: '1.1.0', next: null });
  console.log('远端 1.1.0 == 本地 1.1.0 = ' + JSON.stringify(equal));
  check('相等不提示', equal.result === 'up_to_date', '远端==本地不提示更新');
  
  // 测试3: 镜像 lag：latest 滞后但 next 领先？正式版只跟 latest，不越级到 next
  console.log('--- 测试: 镜像 next 领先不越级 ---');
  const lagNext = determineTarget('1.1.0', { latest: '1.1.0', next: '1.2.0-next.1' });
  console.log('determineTarget(正式版, latest<next) = ' + lagNext);
  check('不受 lag 的 next 蛊惑', lagNext === '1.1.0', '正式版目标=latest（1.1.0），不因 next 领先而越级');
  
  // 测试4: 无有效 distTags → check_failed（不误判）
  console.log('--- 测试: 无 distTags 不误判 ---');
  const none = judgeUpdate('1.1.0', null);
  console.log('distTags=null = ' + JSON.stringify(none));
  check('无 distTags 不误判', none.result === 'check_failed', '查询失败返回 check_failed，不误报 update_available');
  
  // 测试5: 空 distTags → check_failed
  console.log('--- 测试: 空 distTags 处理 ---');
  const empty = judgeUpdate('1.1.0', { latest: null, next: null });
  console.log('distTags{latest:null,next:null} = ' + JSON.stringify(empty));
  check('空 distTags 安全', empty.result === 'check_failed', '空 distTags 返回 check_failed');
  
  // 测试6: 正常升版对照（确保不误伤）
  console.log('--- 测试: 正常升级对照 ---');
  const up = judgeUpdate('1.1.0', { latest: '1.2.0', next: null });
  console.log('远端 1.2.0 > 本地 1.1.0 = ' + JSON.stringify(up));
  check('正常升级仍提示', up.result === 'update_available' && up.updateAvailable === true, '远端更高时正常 update_available（对照不误伤）');
  
  // 测试7: prerelease 镜像 next 滞后
  console.log('--- 测试: prerelease 场景 ---');
  const prerelease = judgeUpdate('1.1.8-next.1', { latest: '1.1.7', next: '1.1.8-next.0' });
  console.log('prerelease 本地=next.1, 远端 next=next.0 = ' + JSON.stringify(prerelease));
  check('prerelease 滞后不误报', prerelease.result === 'up_to_date', 'prerelease 远端滞后不提示升级');
  
  // 测试8: parseDistTagsOutput 解析测试
  console.log('--- 测试: parseDistTagsOutput 解析 ---');
  const valid = parseDistTagsOutput('{"latest":"1.1.5","next":"1.2.0-next.0"}');
  check('parse-有效JSON', valid !== null && valid.latest === '1.1.5', '解析有效 JSON');
  
  const invalid = parseDistTagsOutput('invalid json');
  check('parse-无效JSON', invalid === null, '无效 JSON 返回 null');
  
  const emptyJson = parseDistTagsOutput('{}');
  check('parse-空对象', emptyJson !== null && emptyJson.latest === null && emptyJson.next === null, '空对象返回 null 字段');
  
  // 测试9: 镜像 latest 等于本地 → up_to_date
  console.log('--- 测试: 镜像等于本地 ---');
  const mirrorEqual = judgeUpdate('1.1.5', { latest: '1.1.5', next: null });
  check('镜像等于本地', mirrorEqual.result === 'up_to_date', '镜像 latest = 本地版本时不提示');
  
  // 测试10: determineTarget 边界 - 返回 distTags 中最大版本
  console.log('--- 测试: determineTarget 边界 ---');
  const targetHigher = determineTarget('1.1.5', { latest: '1.1.7', next: null });
  check('determineTarget-返回更高版本', targetHigher === '1.1.7', '返回比 current 更高的版本');
  
  // determineTarget 返回 distTags 中最大版本，judgeUpdate 会检查是否 <= current
  const targetLower = determineTarget('1.1.7', { latest: '1.1.5', next: null });
  check('determineTarget-返回distTags最大', targetLower === '1.1.5', 'determineTarget 返回 distTags 中最大版本');
  // 验证 judgeUpdate 会正确处理远端更低的情况
  const lowerJudge = judgeUpdate('1.1.7', { latest: '1.1.5', next: null });
  check('judgeUpdate-远端更低安全', lowerJudge.result === 'up_to_date', '远端更低时 judgeUpdate 返回 up_to_date');
  
  // 汇总
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  if (failCount === 0) {
    status = 'PASS';
    why = '10项测试全部通过';
  } else {
    status = 'FAIL';
    why = failCount + '项测试失败，详见 detail';
  }
  
  console.log('=== D1-40 结论: ' + status + ' ===');
  console.log(why);
  
} catch (e) {
  status = 'BLOCKED';
  why = '加载源码模块失败: ' + e.message;
  console.error('D1-40 BLOCKED: ' + why);
  results.push({ id: '模块加载', status: 'FAIL', detail: why });
}

const output = {
  caseId: 'D1-40',
  status,
  why,
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  results,
  platform: process.platform,
  nodeVersion: process.version,
  srcPath: SRCDIR
};

const logContent = JSON.stringify(output, null, 2);
writeFileSync(OUT, logContent, 'utf8');
console.log('输出到 stdout.log: ' + logContent);

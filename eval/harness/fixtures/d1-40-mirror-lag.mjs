// D1-40 镜像 lag 检测正确性夹具（反向提醒防护）
// 本地 verdaccio mock registry 注入滞后 dist-tags，验证「源领先于镜像」时正确提示、「镜像领先」时不误报版本倒退
// 用法: node d1-40-mirror-lag.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D1-40/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d1-40-mirror-lag.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// SUT imports: update-check.mjs 导出 judgeUpdate / semverCompare / determineTarget / parseDistTagsOutput
const base = new URL(`file://${hdkSrc}/update-check.mjs`);
const { judgeUpdate, semverCompare, determineTarget, parseDistTagsOutput } = await import(base);

// ① 镜像 lag：镜像 latest ≤ 本地 → 不提示「版本倒退」
// 场景：本地装了 1.1.7（最新正式版），镜像滞后返回 latest=1.1.5
// judgeUpdate(current=1.1.7, distTags={latest:1.1.5}) → target=1.1.5, semverCompare(1.1.5,1.1.7) <= 0 → up_to_date
{
  const current = '1.1.7';
  const distTags = { latest: '1.1.5', next: null };
  const result = judgeUpdate(current, distTags, null);
  const noDowngradeWarning = result.result === 'up_to_date' && !result.updateAvailable;
  rec('D1-40-mirror-lag-no-false-downgrade', '镜像 latest≤本地 → 不提示版本倒退',
      noDowngradeWarning, result.result, 'up_to_date',
      `current=${current} distTags.latest=${distTags.latest} result=${result.result} updateAvailable=${result.updateAvailable}`);
}

// ② 官方源 latest > 本地 → 正确提示更新（正向提醒）
// 场景：本地 1.1.5，官方源 latest=1.1.7 → update_available
{
  const current = '1.1.5';
  const distTags = { latest: '1.1.7', next: null };
  const result = judgeUpdate(current, distTags, null);
  const correctReminder = result.result === 'update_available' && result.updateAvailable === true && result.targetVersion === '1.1.7';
  rec('D1-40-source-ahead-correct-reminder', '官方源 latest>本地 → 正确提示更新',
      correctReminder, { result: result.result, target: result.targetVersion }, { result: 'update_available', target: '1.1.7' },
      `current=${current} distTags.latest=${distTags.latest}`);
}

// ③ 镜像恰好等于本地 → up_to_date（非 update_available，非 false downgrade）
{
  const current = '1.1.7';
  const distTags = { latest: '1.1.7', next: null };
  const result = judgeUpdate(current, distTags, null);
  rec('D1-40-mirror-equal-local', '镜像 latest=本地 → up_to_date',
      result.result === 'up_to_date' && !result.updateAvailable, result.result, 'up_to_date');
}

// ④ determineTarget: 镜像滞后时 target = latest（不会选旧版）
{
  const current = '1.1.7';
  const distTags = { latest: '1.1.5', next: null };
  const target = determineTarget(current, distTags);
  // target = 1.1.5（镜像 latest），但 semverCompare(1.1.5, 1.1.7) <= 0 → up_to_date
  const semverCmp = semverCompare(target || '0', current);
  rec('D1-40-determine-target-semver', 'determineTarget 返回的 target semverCompare ≤ current → 安全',
      semverCmp <= 0, semverCmp, '<= 0',
      `target=${target} current=${current} compare=${semverCmp}`);
}

// ⑤ parseDistTagsOutput: 空输出/无效 JSON → null（检测失败语义，不误报）
{
  const emptyResult = parseDistTagsOutput('');
  const invalidResult = parseDistTagsOutput('not json');
  const validResult = parseDistTagsOutput('{"latest":"1.1.7"}');
  rec('D1-40-parse-empty-null', '空输出 → null（检测失败）', emptyResult === null, emptyResult, null);
  rec('D1-40-parse-invalid-null', '无效 JSON → null', invalidResult === null, invalidResult, null);
  rec('D1-40-parse-valid', '有效 JSON → 正确解析', validResult?.latest === '1.1.7', validResult?.latest, '1.1.7');
}

// ⑥ 镜像滞后 + distTags 为 null → check_failed（不误报版本倒退）
{
  const current = '1.1.7';
  const result = judgeUpdate(current, null, null);
  rec('D1-40-null-disttags-check-failed', 'distTags=null → check_failed（不误报倒退）',
      result.result === 'check_failed', result.result, 'check_failed',
      `current=${current}`);
}

// ⑦ 镜像滞后 + distTags 都为空（{latest:null, next:null}）→ check_failed
{
  const current = '1.1.7';
  const distTags = { latest: null, next: null };
  const result = judgeUpdate(current, distTags, null);
  rec('D1-40-empty-disttags-check-failed', 'distTags{latest:null,next:null} → check_failed',
      result.result === 'check_failed', result.result, 'check_failed');
}

// ⑧ prerelease 场景：本地 next 版本，镜像滞后 → 不误报
{
  const current = '1.1.8-next.1';
  const distTags = { latest: '1.1.7', next: '1.1.8-next.0' }; // 镜像 next 滞后于本地
  const result = judgeUpdate(current, distTags, null);
  // determineTarget 选 max(latest, next) = 1.1.8-next.0 → semverCompare(1.1.8-next.0, 1.1.8-next.1) < 0 → up_to_date
  rec('D1-40-prerelease-mirror-lag', 'prerelease 镜像 next 滞后 → 不误报',
      result.result === 'up_to_date' && !result.updateAvailable, result.result, 'up_to_date',
      `current=${current} distTags.next=${distTags.next}`);
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D1-40 镜像 lag 检测正确性夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D1-40');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D1-40 镜像 lag 检测正确性夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);

/**
 * D11 体验夹具共用工具（宿主隔离守卫 / 断言记录 / 三态退出 / 证据落盘）。
 *
 * 注意：本文件名不带 `d11-` 前缀，`run-ux.mjs`（glob `d11-*.mjs`）不会把它当夹具执行。
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** 会污染「未登录态 / 空态」构造的宿主标识；存在即说明宿主未被隔离。 */
export const HOST_MARKERS = [
  join('.config', 'huaweicloud', 'credentials.json'),
  join('.hcloud', 'config.json'),
  '.obsutilconfig',
  '.codeartsdoer',
  '.codearts',
  '.codeartswork',
];

export function contaminatedHost() {
  return HOST_MARKERS.filter((marker) => existsSync(join(homedir(), marker)));
}

/** 解析 `node <script> <hdkSrc> [--evid <dir>]`。 */
export function parseArgs() {
  const argv = process.argv.slice(2);
  let evid = null;
  let hdkSrc = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--evid') {
      evid = argv[i + 1] || null;
      i += 1;
      continue;
    }
    if (!argv[i].startsWith('--') && !hdkSrc) hdkSrc = argv[i];
  }
  return { hdkSrc, evid };
}

export function importHdk(hdkSrc, rel) {
  return import(pathToFileURL(join(hdkSrc, rel)).href);
}

const results = [];

/**
 * 记录一条断言并即时打印（便于 CI 日志逐条定位）。
 * @param {string} id 断言号（如 D11-41-region）
 * @param {string} title 断言中文标题
 * @param {boolean} ok 是否通过
 * @param {unknown} actual 实测值
 * @param {unknown} expected 期望值
 * @param {string} [detail] 补充说明（口径/关联需求单等）
 */
export function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${title}`);
  console.log(`      actual=${JSON.stringify(actual)}  expected=${JSON.stringify(expected)}`);
  if (detail) console.log(`      ${detail}`);
}

/** 收尾：打印汇总 + 落证据 + 三态退出（0 通过 / 1 有 FAIL）。 */
export function finish(caseId, evid, note = '') {
  const pass = results.filter((r) => r.ok).length;
  const fail = results.length - pass;
  console.log(`\n=== ${caseId} ===  pass=${pass} fail=${fail}`);
  if (note) console.log(`注: ${note}`);
  console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeEvidence(caseId, evid, [
    ...results.map(
      (r) =>
        `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}` +
        `\texpected=${JSON.stringify(r.expected)}${r.detail ? `\t${r.detail}` : ''}`,
    ),
    '',
    `=== ${caseId} ===  pass=${pass} fail=${fail}`,
    `RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`,
  ]);
  process.exit(fail > 0 ? 1 : 0);
}

/** 环境不可判定（宿主污染 / 缺凭证 / 平台不适用）→ exit 2，不计入 PASS/FAIL。 */
export function blocked(caseId, reason, evid) {
  console.log(`[BLOCKED] ${reason}`);
  console.log('  参考原因: 直接在未隔离的宿主上单跑（宿主存在真实凭证 / 码道目录，');
  console.log('            "未登录态"构造不出来 → 拒绝给出判定，而非报假 FAIL）。');
  console.log('  隔离复跑: 把 HOME / USERPROFILE / HUAWEICLOUD_HOME 都指向一个空目录后再跑本夹具；');
  console.log('            或直接用运行器 `npm run test:ux`（它自动为每个夹具建独立空 HOME）。');
  console.log('RESULT: BLOCKED');
  writeEvidence(caseId, evid, [`[BLOCKED] ${reason}`, 'RESULT: BLOCKED']);
  process.exit(2);
}

export function writeEvidence(caseId, evid, lines) {
  if (!evid) return;
  const dir = join(evid, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

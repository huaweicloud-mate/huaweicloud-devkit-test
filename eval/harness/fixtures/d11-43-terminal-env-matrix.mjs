#!/usr/bin/env node
/**
 * D11-43 终端环境矩阵（无颜色 / C locale / 窄列）（体验级）
 *
 * 判据（范式③「独立可观测面」的终端环境侧）：在**受限终端环境**下跑真实 CLI，关键信息必须完好：
 *   ① `NO_COLOR=1`  → 输出不得含 ANSI 转义序列（尊重 NO_COLOR 约定）
 *   ② `LC_ALL=C / LANG=C` → 输出不得出现替换字符 U+FFFD（不依赖 locale 才能正确解码）
 *   ③ `COLUMNS=40` → 关键标识（动作名 / 配置文件路径）不得被截断
 *   ④ 反退化：非交互会话仍应拒绝执行并给出 exit 1（不得静默成功）
 *
 * 观测方式：spawnSync 真实 CLI（`node <hdk src>/setup-cli.mjs auth init`），stdio 走 pipe（天然非 TTY）。
 *
 * 用法: node d11-43-terminal-env-matrix.mjs <hdk src> [--evid <dir>]
 * 退出: 0 全通过 / 1 有 FAIL / 2 BLOCKED（宿主污染 / CLI 入口缺失）
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';

import { blocked, contaminatedHost, finish, parseArgs, rec } from './ux-common.mjs';

const CASE = 'D11-43';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error(`用法: node ${basename(process.argv[1])} <hdk src> [--evid <dir>]`);
  process.exit(2);
}
const cli = join(hdkSrc, 'setup-cli.mjs');
if (!existsSync(cli)) blocked(CASE, `CLI 入口不存在: ${cli}`, evid);
const contam = contaminatedHost();
if (contam.length) {
  blocked(CASE, `宿主受污染(${contam.join(', ')})——未登录态构造不出`, evid);
}

const env = {
  ...process.env,
  NO_COLOR: '1',
  TERM: 'dumb',
  LANG: 'C',
  LC_ALL: 'C',
  COLUMNS: '40',
};
const run = spawnSync(process.execPath, [cli, 'auth', 'init'], {
  env,
  encoding: 'utf8',
  timeout: 30000,
  windowsHide: true,
});
const out = `${run.stdout ?? ''}${run.stderr ?? ''}`;

rec(
  `${CASE}-nocolor`,
  'NO_COLOR=1 时输出不含 ANSI 转义序列',
  !/\u001b\[/.test(out),
  /\u001b\[/.test(out) ? '检测到 ANSI 序列' : '无 ANSI 序列',
  '无 ANSI 序列',
  '失败=未尊重 NO_COLOR 约定（终端兼容体验改进 UX-R16）',
);
rec(
  `${CASE}-langc`,
  'LC_ALL=C 时输出无替换字符（不依赖 locale）',
  !out.includes('\uFFFD'),
  out.includes('\uFFFD') ? '出现 U+FFFD' : '无 U+FFFD',
  '无 U+FFFD',
);
const keyToken = ['creds-import.json', 'auth init', 'huaweicloud_auth_switch'].find((t) =>
  out.includes(t),
);
rec(
  `${CASE}-cols`,
  'COLUMNS=40 下关键标识完整（未被截断）',
  Boolean(keyToken) || out.length === 0,
  keyToken ?? (out.length === 0 ? '(无输出)' : '未出现任何关键标识'),
  '含 creds-import.json / auth init / huaweicloud_auth_switch 之一',
);
rec(
  `${CASE}-exit`,
  '非交互会话应拒绝执行（exit 非 0）',
  run.status !== 0,
  run.status,
  '非 0（预期 1）',
);

finish(CASE, evid, '口径: 需求验收（终端环境兼容）；FAIL=受限终端下信息缺失/污染');

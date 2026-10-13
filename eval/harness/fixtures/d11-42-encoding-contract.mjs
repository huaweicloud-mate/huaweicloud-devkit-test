#!/usr/bin/env node
/**
 * D11-42 输出编码契约（跨平台：Windows cp936 控制台 / 非 Windows LC_ALL=C）
 *
 * ⚠️ 判据修正说明（2026-10-13 实测，重要）
 *
 * 本用例**原先**断言「cp936 控制台下中文可读（无乱码）」。实测证明那是**错误判据**：
 *   ① Node 在**真实 TTY** 下走 `WriteConsoleW`（UTF-16 控制台 API），中文显示与控制台
 *      代码页无关 —— 真实用户场景本来就不乱码；
 *   ② 夹具用的是**管道捕获**，实际测到的是「piped UTF-8 字节被消费方按 GBK 解码」，
 *      那是**消费方选择解码方式**的问题，不是插件契约；
 *   ③ 反过来若按该 FAIL 要求插件输出 GBK，会**破坏所有 UTF-8 消费方（尤其 agent）** ——
 *      是错误需求。
 *
 * 故本用例只锁定**真正属插件契约、且会静默退化**的那一条：
 *   **无论控制台代码页 / locale 如何，插件输出恒为 UTF-8**（正断言 + 反断言）。
 * 控制台渲染可读性属终端配置，不在本用例范围（终端环境见 D11-43 的 NO_COLOR / 窄列）。
 *
 * 用法: node d11-42-encoding-contract.mjs <hdk src> [--evid <dir>]
 * 退出: 0 全通过 / 1 有 FAIL / 2 BLOCKED（宿主污染或子进程无输出）
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { blocked, contaminatedHost, finish, parseArgs, rec } from './ux-common.mjs';

const CASE = 'D11-42';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error(`用法: node ${basename(process.argv[1])} <hdk src> [--evid <dir>]`);
  process.exit(2);
}
const contam = contaminatedHost();
if (contam.length) {
  blocked(CASE, `宿主受污染(${contam.join(', ')})——未登录态构造不出`, evid);
}

const isWin = process.platform === 'win32';
if (isWin) {
  try {
    new TextDecoder('gbk');
  } catch {
    blocked(CASE, '本机 Node 不支持 GBK 解码（需 full-icu）', evid);
  }
}

// 子进程：走真实插件代码触发未登录错误，把错误码与中文引导打到 stdout
const childDir = mkdtempSync(join(tmpdir(), 'd11-42-'));
const childScript = join(childDir, 'emit.mjs');
const credUrl = pathToFileURL(join(hdkSrc, 'auth', 'credentials.mjs')).href;
writeFileSync(
  childScript,
  `import { resolveCredentials } from ${JSON.stringify(credUrl)};
try { resolveCredentials(); } catch (err) {
  console.log(err?.code ?? 'NO_CODE');
  console.log(err?.onboarding?.message ?? 'NO_MSG');
}
`,
  'utf8',
);

// 平台对应的"非 UTF-8 本地编码"环境：Windows 用 cp936 控制台，其余用 C locale
let run;
if (isWin) {
  // 用临时 .cmd 批量文件切码页（避免 cmd 引号坑：`/s` 剥坏内层引号；
  // `cmd /c "<无空格路径>"` 会保留引号 → 用 cwd + 裸文件名）
  const runner = join(childDir, 'run.cmd');
  writeFileSync(
    runner,
    `@echo off\r\nchcp 936 >nul\r\n"${process.execPath}" "${childScript}"\r\n`,
    'latin1',
  );
  run = spawnSync('cmd.exe', ['/d', '/c', 'run.cmd'], {
    cwd: childDir,
    encoding: null,
    windowsHide: true,
    timeout: 30000,
  });
} else {
  run = spawnSync(process.execPath, [childScript], {
    env: { ...process.env, LC_ALL: 'C', LANG: 'C' },
    encoding: null,
    windowsHide: true,
    timeout: 30000,
  });
}

const raw = run.stdout ?? Buffer.alloc(0);
if (raw.length === 0) {
  blocked(
    CASE,
    `子进程无输出（exit=${run.status}）——夹具自身异常，非产品缺口：` +
      String(run.stderr ?? '').toString('utf8').slice(0, 160),
    evid,
  );
}

const asUtf8 = raw.toString('utf8');
const asLocal = isWin ? new TextDecoder('gbk').decode(raw) : raw.toString('latin1');
const LOCAL_NAME = isWin ? 'cp936(GBK)' : 'latin1';

const codeIntact = asUtf8.includes('HDKIT_CRED_MISSING');
rec(
  `${CASE}-ascii`,
  `关键 ASCII 字段（错误码）在 ${LOCAL_NAME} 环境下完好`,
  codeIntact,
  raw.toString('utf8').trim().split(/\r?\n/).filter(Boolean).slice(0, 2),
  '含 HDKIT_CRED_MISSING',
);

rec(
  `${CASE}-utf8-contract`,
  '中文输出为 UTF-8（与代码页/locale 无关）',
  asUtf8.includes('未配置'),
  asUtf8.includes('未配置') ? 'UTF-8 解码含「未配置」' : asUtf8.slice(0, 80),
  'UTF-8 解码含「未配置」',
  '正断言：UTF-8 解码可读（消费方应按 UTF-8 解码）',
);

rec(
  `${CASE}-not-local-encoded`,
  `输出未被转成本地编码（反断言，防退化成 ${LOCAL_NAME}）`,
  !asLocal.includes('未配置'),
  asLocal.includes('未配置') ? `被 ${LOCAL_NAME} 转码了` : `未被 ${LOCAL_NAME} 转码`,
  `反断言：${LOCAL_NAME} 解码不含「未配置」`,
  '防退化：若日后为"迁就控制台"改成 GBK/latin1 输出，会破坏 agent 等 UTF-8 消费方',
);

finish(
  CASE,
  evid,
  '口径: 输出编码契约（恒为 UTF-8）；控制台渲染可读性属终端配置，不在本用例范围（见 D11-43）',
);

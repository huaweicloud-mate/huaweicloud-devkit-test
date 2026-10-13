#!/usr/bin/env node
/**
 * D11-42 Windows cp936（GBK）终端中文可读性（体验级）
 *
 * 判据（范式③「独立可观测面」的终端兼容侧）：在 **cp936 代码页**的真实 Windows 控制台里，
 * 插件输出给用户的中文必须**可读**，不得因编码不匹配变成乱码；ASCII 字段（错误码）必须完好。
 *
 * 观测方式：`cmd /c "chcp 936 & node <child>"` 起真实 cp936 控制台，子进程走**真实插件代码**
 * 触发未登录错误并打印中文引导；父进程拿原始字节，分别按 UTF-8 与 GBK 解码比对。
 *
 * 用法: node d11-42-cp936-terminal.mjs <hdk src> [--evid <dir>]
 * 退出: 0 全通过 / 1 有 FAIL / 2 BLOCKED（非 Windows 或宿主污染或环境不支持）
 *
 * 注：本用例 FAIL 表示「插件未做 cp936 适配」——属**终端兼容体验改进**（UX-R16），
 *     不是功能中断；修复方向：检测控制台代码页后转码，或中文不可用时降级为 ASCII 提示。
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
if (process.platform !== 'win32') {
  blocked(CASE, 'cp936 终端仅 Windows 适用（本机为 ' + process.platform + '）', evid);
}
const contam = contaminatedHost();
if (contam.length) {
  blocked(CASE, `宿主受污染(${contam.join(', ')})——未登录态构造不出`, evid);
}
try {
  new TextDecoder('gbk');
} catch {
  blocked(CASE, '本机 Node 不支持 GBK 解码（需 full-icu）', evid);
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

// 用临时 .cmd 批量文件切码页后起子进程（cwd 设为脚本目录 + 裸文件名调用）。
// 两个 cmd 引号坑（本夹具调试时都踩过，会产出假 FAIL）：
//   ① `cmd /d /s /c "chcp 936 >nul & \"<exe>\" \"<script>\""` —— `/s` 剥坏内层引号；
//   ② `cmd /d /c "\"<无空格的绝对路径>\""` —— cmd 仅在引号内含空白时才剥引号，
//      否则连引号一起当命令名 → `'"<path>"' is not recognized`。
const runner = join(childDir, 'run.cmd');
writeFileSync(
  runner,
  `@echo off\r\nchcp 936 >nul\r\n"${process.execPath}" "${childScript}"\r\n`,
  'latin1',
);
const run = spawnSync('cmd.exe', ['/d', '/c', 'run.cmd'], {
  cwd: childDir,
  encoding: null,
  windowsHide: true,
  timeout: 30000,
});
const raw = run.stdout ?? Buffer.alloc(0);
const asUtf8 = raw.toString('utf8');
const asCp936 = new TextDecoder('gbk').decode(raw);
if (raw.length === 0) {
  blocked(
    CASE,
    `cp936 子进程无输出（exit=${run.status}）——夹具自身异常，非产品缺口：` +
      String(run.stderr ?? '').toString('utf8').slice(0, 160),
    evid,
  );
}

rec(
  `${CASE}-ascii`,
  'ASCII 错误码在 cp936 控制台下完好',
  asCp936.includes('HDKIT_CRED_MISSING'),
  asCp936.trim().split(/\r?\n/).filter(Boolean).slice(0, 2),
  '含 HDKIT_CRED_MISSING',
);
rec(
  `${CASE}-zh` ,
  'cp936 控制台下中文引导可读（无乱码）',
  asCp936.includes('未配置') && !asCp936.includes('\uFFFD'),
  asCp936.trim().split(/\r?\n/).filter(Boolean).slice(0, 2),
  '含「未配置」',
  '失败=插件未做 cp936 适配（终端兼容体验改进 UX-R16）',
);
rec(
  `${CASE}-bytes-utf8`,
  '字节流本身为 UTF-8（信息性：说明乱码源于代码页不匹配）',
  asUtf8.includes('未配置') || asUtf8.includes('Huawei Cloud credentials'),
  asUtf8.includes('未配置') ? 'UTF-8 中文' : 'UTF-8(?)/ASCII',
  'UTF-8 输出',
);

finish(CASE, evid, '口径: 需求验收（终端编码兼容）；FAIL=cp936 下用户看到乱码');

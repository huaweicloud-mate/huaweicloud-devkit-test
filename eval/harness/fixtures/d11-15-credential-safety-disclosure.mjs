// D11-15 敏感信息披露与安全感（P2）—— 可执行载体（源码级核对 + 状态面）
//
// 判据（CSV::预期结果）：输出显式包含「AK/SK 不进入会话上下文」「不写入 shell 历史」
//   「凭证文件 mode 0600」三项中至少两项。
// 指引来源：cmdAuthInit(setup-cli.mjs) + writeGlobalCredentials(credentials.mjs:205)
// 口径说明：三项披露是「文案类」判据，真源即源码文案与 auth_status 披露面；
//   故本载体做源码级核对（跨平台一致、可防文案退化），不依赖真机写盘权限（Windows 无 POSIX mode 亦不影响核对）。
// 用法: node d11-15-credential-safety-disclosure.mjs <hdk src> [--evid <dir>]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { blocked, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-15';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-15-credential-safety-disclosure.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const FILES = ['setup-cli.mjs', 'auth/credentials.mjs', 'auth/service.mjs', 'tools.mjs'];
let corpus = '';
const read = [];
for (const f of FILES) {
  try {
    const t = readFileSync(join(hdkSrc, f), 'utf8');
    corpus += `\n${t}`;
    read.push(f);
  } catch { /* 缺文件忽略 */ }
}
if (corpus.trim() === '') blocked(CASE_ID, '无法读取任何目标源文件，无法做文案核对', evid);

const DISCLOSURES = [
  ['AK/SK 不进入会话上下文', /不进入(会话|对话)?上下文|不进上下文|不会写入会话|不落会话|never\s+(enters|echoed)|not\s+logged/i],
  ['不写入 shell 历史', /shell\s*历史|命令历史|history\s*文件|不进\s*history/i],
  ['凭证文件权限 0600', /0600|chmod\s*0?600|仅(本人|当前用户)可读|owner-only/i],
];
const hits = DISCLOSURES.filter(([, re]) => re.test(corpus)).map(([name]) => name);

rec('D11-15-two-of-three', '三项安全披露中至少显式出现两项（AK/SK 不进会话上下文 / 不写 shell 历史 / 文件 0600）',
  hits.length >= 2, { 命中: hits, 核对文件: read }, '>= 2 项',
  'UX-R5/R11：首次登录须给用户“凭证不会被泄漏”的确认');

// 状态面：登录后是否能看到披露（auth_status 的安全/隐私面）
const iso = isolateHome('d11-15');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
creds.writeGlobalCredentials({ ak: 'D11FIFTEENAK0001', sk: 'D11FIFTEENSK0001', region: 'cn-north-4' });
const st = svc.getAuthStatus();
const blob = JSON.stringify(st ?? {});
rec('D11-15-status-surface', 'auth_status 暴露安全/隐私披露面（security/privacy 字段）',
  /security|privacy|安全|隐私|redact/i.test(Object.keys(st ?? {}).join(',')) || /不进入上下文|0600/.test(blob),
  { 相关字段: Object.keys(st ?? {}).filter((k) => /secur|privac|安全|隐私|redact/i.test(k)) },
  '存在披露字段');
rec('D11-15-no-secret-echo', '登录返回体不回显 AK/SK 明文（反断言）',
  !blob.includes('D11FIFTEENAK0001') && !blob.includes('D11FIFTEENSK0001'), '已检查返回体全文', '无明文');
iso.restore();

finish(CASE_ID, evid, '口径: 需求验收（UX-R5/R11）；FAIL = 缺安全感披露，非 harness 问题');

// D11-10 auth init 交互提示中文化（P1）—— 可执行载体（源码级核对）
//
// 判据（CSV::预期结果）：AK/SK/安全令牌/region 四类提示均为含中文字符的字符串
//   （不出现 "Access Key ID (AK): " / "Secret Access Key (SK): " / "Security Token (optional, press Enter to skip): " 三处英文原文）。
// 指引来源：cmdAuthInit(setup-cli.mjs:4892+) 的交互分支
//
// 口径说明（为何走源码级核对）：这些提示只在 TTY 交互分支出现，headless 夹具无法捕获真实 PTY 提示；
//   故本载体核对「提示文案来源」本身（英文原文是否仍在源码中 + 四类提示是否已中文化）。
//   真正的 PTY 捕获属 L1/人工补充，见用例「阻塞=需 PTY 捕获」。
// 用法: node d11-10-authinit-prompt-zh.mjs <hdk src> [--evid <dir>]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { blocked, finish, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-10';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-10-authinit-prompt-zh.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

let src = '';
try {
  src = readFileSync(join(hdkSrc, 'setup-cli.mjs'), 'utf8');
} catch (e) {
  blocked(CASE_ID, `无法读取 setup-cli.mjs：${String(e.message).slice(0, 100)}`, evid);
}

const EN = [
  'Access Key ID (AK): ',
  'Secret Access Key (SK): ',
  'Security Token (optional, press Enter to skip): ',
];
const stillEnglish = EN.filter((s) => src.includes(s));

// 提示语句：收集 readLineQuestion/readSecret/readLine 的字符串实参
const prompts = (src.match(/(?:readLineQuestion|readSecret|readLine)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g) || [])
  .map((m) => m.replace(/^[^(]*\(\s*['"`]/, '').replace(/['"`]$/, ''));
const ZH = /[\u4e00-\u9fff]/;
const pick = (kw) => prompts.find((p) => kw.test(p)) || '';
const CATS = {
  AK: pick(/\bAK\b|Access\s*Key/i),
  SK: pick(/\bSK\b|Secret\s*Access\s*Key/i),
  '安全令牌': pick(/token|令牌/i),
  region: pick(/region|区域/i),
};

rec('D11-10-no-en-original', '源码中不再出现三处英文提示原文',
  stillEnglish.length === 0, stillEnglish.length ? stillEnglish : '（未命中英文原文）', '三处英文原文均为 0');
for (const [name, text] of Object.entries(CATS)) {
  rec(`D11-10-${name}-zh`, `${name} 类提示为中文`, Boolean(text) && ZH.test(text),
    text ? text.slice(0, 90) : '（未找到该类提示语句）', '存在且含中文字符');
}

finish(CASE_ID, evid, '口径: 需求验收（UX-R6 登录流程母语化）；FAIL = 提示未中文化，非 harness 问题');

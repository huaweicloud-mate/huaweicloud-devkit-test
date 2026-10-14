// D11-26 工具描述人话化（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：面向用户的 description 与 enum 描述中
//   ① 不出现内部代号 S1/S2/S3/A+C/R2/R9/R10/R11
//   ② 不含英文整句（如 "Switch Huawei Cloud credentials within the current session."）
// 指引来源：tools.mjs:540(A+C)/:556(S1)/:1059(S1,S2,R9)/:1244(label 含 S1)
//
// 做法：直接 import 目标源码的 TOOL_DEFINITIONS，静态遍历 description 与各属性描述。
// 口径：需求验收（UX-R17 术语人话化）。实现前预期 FAIL。
// 用法: node d11-26-terminology.mjs <hdk src> [--evid <dir>]
import { blocked, finish, importHdk, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-26';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-26-terminology.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

let TOOL_DEFINITIONS = null;
try {
  ({ TOOL_DEFINITIONS } = await importHdk(hdkSrc, 'tools.mjs'));
} catch (e) {
  blocked(CASE_ID, `无法加载 tools.mjs 的 TOOL_DEFINITIONS：${String(e.message).slice(0, 120)}`, evid);
}
if (!Array.isArray(TOOL_DEFINITIONS) || TOOL_DEFINITIONS.length === 0) {
  blocked(CASE_ID, 'TOOL_DEFINITIONS 为空或结构不符（无法做静态核对）', evid);
}
console.log(`[INFO] 工具定义 ${TOOL_DEFINITIONS.length} 条`);

const CODENAME = /\b(S1|S2|S3|R2|R9|R10|R11)\b|A\+C/;
const ZH = /[\u4e00-\u9fff]/;
const EN_SENTENCE = /[A-Za-z]{2,}\s+[A-Za-z]{2,}\s+[A-Za-z]{2,}/; // 连续 3 个英文词 ≈ 英文整句

// 收集所有"面向用户"的文本：工具描述 + 参数描述
const texts = [];
for (const t of TOOL_DEFINITIONS) {
  if (t?.description) texts.push({ where: `${t.name}.description`, text: String(t.description) });
  const props = t?.inputSchema?.properties || {};
  for (const [k, v] of Object.entries(props)) {
    if (v?.description) texts.push({ where: `${t.name}.${k}`, text: String(v.description) });
  }
}

const codeHits = texts.filter((x) => CODENAME.test(x.text));
const enHits = texts.filter((x) => EN_SENTENCE.test(x.text) && !ZH.test(x.text));

const brief = (hits) => hits.slice(0, 5).map((x) => x.where).join(' | ') + (hits.length > 5 ? ` …共 ${hits.length} 处` : '');

rec('D11-26-no-codename', '工具/参数描述不含内部代号（S1/S2/S3/A+C/R2/R9/R10/R11）',
  codeHits.length === 0, codeHits.length ? brief(codeHits) : '无命中', '不含内部代号',
  '反断言：内部代号不应出现在面向用户的文案里');
rec('D11-26-no-en-sentence', '工具/参数描述不含英文整句（反断言）',
  enHits.length === 0, enHits.length ? brief(enHits) : '无命中', '全中文描述',
  '纯英文且无中文的描述 = 未母语化');

finish(CASE_ID, evid, '口径: 需求验收（UX-R17）；FAIL = 文案未母语化/含内部代号，非 harness 问题');

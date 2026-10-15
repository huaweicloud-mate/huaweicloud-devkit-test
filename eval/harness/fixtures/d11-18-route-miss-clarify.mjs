// D11-18 路由 MISS 中文澄清追问（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：返回体含非空中文澄清字段（候选服务列表或追问语句），不返回静默空路由。
// 指引来源：service_catalog(tools.mjs) 的兜底分支
//
// 做法：用一条与云服务无关的中文输入调 service_catalog，检查兜底是否给出「中文澄清/候选」。
// 口径：需求验收（UX-R16 路由兜底）。实现前预期 FAIL（当前兜底为英文 capabilityOrder）。
// 用法: node d11-18-route-miss-clarify.mjs <hdk src> [--evid <dir>]
import { finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-18';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-18-route-miss-clarify.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const iso = isolateHome('d11-18');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const r = await callTool('huaweicloud_service_catalog', { query: '今天天气怎么样' });
const ZH = /[\u4e00-\u9fff]/;
const blob = JSON.stringify(r ?? {});

// 澄清面的候选字段名未冻结：按语义找任意“澄清/追问/候选”字段
const clarifyField = Object.entries(r ?? {}).find(([k, v]) =>
  /clarif|question|ask|hint|追问|澄清|candidate|候选/i.test(k) &&
  (Array.isArray(v) ? v.length > 0 : Boolean(v)));
const clarifyText = clarifyField
  ? (Array.isArray(clarifyField[1]) ? clarifyField[1].map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' | ') : String(clarifyField[1]))
  : '';

const values = Object.values(r ?? {});
const isEmptyRoute = values.length === 0 || values.every((v) => (Array.isArray(v) ? v.length === 0 : !v));

rec('D11-18-clarify-zh', '无关输入返回非空中文澄清字段（候选服务或追问语句）',
  Boolean(clarifyField) && ZH.test(clarifyText),
  { 字段: clarifyField ? clarifyField[0] : '（无澄清字段）', 文本: clarifyText.slice(0, 90) || null },
  '存在澄清字段且含中文');
rec('D11-18-candidates', '或给出候选服务列表（可选项而非静默失败）',
  Array.isArray(r?.candidates) ? r.candidates.length > 0 : /候选|candidates/i.test(blob),
  { candidates: Array.isArray(r?.candidates) ? r.candidates.length : r?.candidates ?? null },
  '候选列表非空');
rec('D11-18-not-silent-empty', '不返回静默空路由',
  !isEmptyRoute, { 空路由: isEmptyRoute, 返回字段: Object.keys(r ?? {}) }, '返回体非空');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R16 兜底）；FAIL = 兜底未给中文澄清，非 harness 问题');

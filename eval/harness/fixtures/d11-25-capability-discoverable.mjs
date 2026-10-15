// D11-25 会话内能力可发现性（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：返回中文能力清单（分组列举核心能力并指向
//   huaweicloud_retrieve_skill / huaweicloud_service_catalog），不返回空结果或纯英文工具名罗列。
// 指引来源：retrieve_skill / service_catalog(tools.mjs:403/415)
//
// 做法：会话内调用两个能力发现工具，检查是否给出「中文 + 分组 + 指向工具名」的能力清单。
// 口径：需求验收（UX-R15 能力可发现性）。实现前预期 FAIL（当前 capability 文案为英文）。
// 用法: node d11-25-capability-discoverable.mjs <hdk src> [--evid <dir>]
import { finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-25';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-25-capability-discoverable.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const iso = isolateHome('d11-25');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const ZH = /[\u4e00-\u9fff]/;

// ① 能力清单入口：service_catalog（兜底会给能力顺序）
let cat = null;
try { cat = await callTool('huaweicloud_service_catalog', { query: '我有哪些能力' }); } catch (e) { cat = { error: String(e?.message).slice(0, 80) }; }
const catBlob = JSON.stringify(cat ?? {});

// ② 技能检索入口：retrieve_skill
let skill = null;
try { skill = await callTool('huaweicloud_retrieve_skill', { name: 'huaweicloud-cli-and-auth' }); } catch (e) { skill = { error: String(e?.message).slice(0, 80) }; }
const skillBlob = JSON.stringify(skill ?? {});

const isEmpty = (o) => {
  const v = Object.values(o ?? {});
  return v.length === 0 || v.every((x) => (Array.isArray(x) ? x.length === 0 : !x));
};

rec('D11-25-list-zh', '能力清单为中文（非纯英文文案）',
  ZH.test(catBlob) && !/^[\x00-\x7F]*$/.test(catBlob), { 清单片断: catBlob.slice(0, 110) }, '含中文字符');
rec('D11-25-pointers', '清单指向 huaweicloud_retrieve_skill 与 huaweicloud_service_catalog 两个工具',
  /huaweicloud_retrieve_skill/.test(catBlob) && /huaweicloud_service_catalog/.test(catBlob),
  { retrieve_skill: /huaweicloud_retrieve_skill/.test(catBlob), service_catalog: /huaweicloud_service_catalog/.test(catBlob) },
  '两个工具名均出现');
rec('D11-25-grouped', '分组列举核心能力（而非扁平英文工具名罗列）',
  Array.isArray(cat?.capabilityOrder) && cat.capabilityOrder.length >= 3 && ZH.test(String(cat.capabilityOrder.join(''))),
  { capabilityOrder条数: Array.isArray(cat?.capabilityOrder) ? cat.capabilityOrder.length : null },
  '>=3 条且中文');
rec('D11-25-nonempty', '不返回空结果（两个入口均非空）',
  !isEmpty(cat) && !isEmpty(skill), { catalog空: isEmpty(cat), retrieve_skill空: isEmpty(skill) }, '均非空');
rec('D11-25-skill-zh', '技能检索返回中文化技能说明（反断言：非纯英文）',
  ZH.test(skillBlob), { 片断: skillBlob.slice(0, 110) }, '含中文字符');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R15）；FAIL = 能力清单未中文化/未指向工具，非 harness 问题');

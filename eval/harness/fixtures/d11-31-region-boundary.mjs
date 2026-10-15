// D11-31 region 合法性与非法值边界（边界值法）（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：非法 region 返回中文可动作提示且含可用区域候选（源自 huaweicloud_list_regions）；
//   空串回退默认值 cn-north-4；大小写不规范值给出中文规范化提示；五类取值提示互不混淆。
// 指引来源：auth_switch/list_regions(tools.mjs:415) + writeGlobalCredentials(credentials.mjs)
//
// 五类取值（边界值 + 错误猜测）：
//   ① 合法     cn-north-4        ② 非法     cn-nowhere-9      ③ 空串   ''
//   ④ 大小写不规范 CN-NORTH-4    ⑤ 格式不符 fk-xxx-99999
// 口径：需求验收（UX-R5 region 处理）。实现前预期 FAIL。
// 用法: node d11-31-region-boundary.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-31';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-31-region-boundary.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-31');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const ZH = /[\u4e00-\u9fff]/;
const AK = 'D11THIRTYONEAK001';
const SK = 'D11THIRTYONESK001';

// 候选区域来源（判据要求非法值提示里给候选）
let candidates = [];
try {
  const r = await callTool('huaweicloud_list_regions', {});
  candidates = [...new Set((JSON.stringify(r ?? {}).match(/[a-z]{2}-[a-z]+-\d/g) || []))];
} catch { candidates = []; }

const probe = async (region) => {
  try {
    const r = await callTool('huaweicloud_auth_switch', { mode: 'memory', action: 'temporary', ak: AK, sk: SK, region });
    return { text: JSON.stringify(r ?? {}), threw: false };
  } catch (e) {
    return { text: String(e?.message ?? e), threw: true };
  }
};

const legal = await probe('cn-north-4');
const invalid = await probe('cn-nowhere-9');
const weird = await probe('CN-NORTH-4');
const malformed = await probe('fk-xxx-99999');

// 空串：写盘后回读，判是否回退默认值
let emptyRegion = null;
try {
  creds.writeGlobalCredentials({ ak: AK, sk: SK, region: '' });
  emptyRegion = creds.readGlobalCredentials()?.region ?? null;
} catch (e) {
  emptyRegion = `抛错: ${String(e?.message).slice(0, 60)}`;
}

rec('D11-31-legal-ok', '合法 region 正常生效（基线对照）',
  !legal.threw, legal.text.slice(0, 90), '正常返回');
rec('D11-31-invalid-hint-zh', '非法 region 返回中文可动作提示',
  ZH.test(invalid.text) && /无效|不支持|不可用|请选择/.test(invalid.text), invalid.text.slice(0, 120), '中文「无效/不支持」提示');
rec('D11-31-invalid-candidates', '非法提示含可用区域候选（源自 list_regions）',
  candidates.length > 0 && candidates.some((c) => invalid.text.includes(c)),
  { 候选来源条数: candidates.length, 候选示例: candidates.slice(0, 5), 提示是否含候选: candidates.some((c) => invalid.text.includes(c)) },
  '提示里出现候选区域');
rec('D11-31-empty-default', '空串回退默认值 cn-north-4',
  emptyRegion === 'cn-north-4', { 回读region: emptyRegion }, 'cn-north-4');
rec('D11-31-case-normalize-zh', '大小写不规范给出中文规范化提示',
  ZH.test(weird.text) && /规范|小写|大小写/.test(weird.text), weird.text.slice(0, 120), '中文规范化提示');
rec('D11-31-distinct-hints', '五类取值提示互不混淆（去重后至少 4 类不同文本）',
  new Set([legal.text, invalid.text, weird.text, malformed.text].map((t) => t.slice(0, 60))).size >= 4,
  { 合法: legal.text.slice(0, 40), 非法: invalid.text.slice(0, 40), 大小写: weird.text.slice(0, 40), 格式不符: malformed.text.slice(0, 40) },
  '四类文本互不相同');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R5）；FAIL = region 边界处理未实现，非 harness 问题');

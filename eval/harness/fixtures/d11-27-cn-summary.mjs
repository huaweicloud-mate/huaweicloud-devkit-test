// D11-27 工具返回中文摘要与长输出可读性（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：返回体含中文字段摘要（至少覆盖 资源标识/名称/状态 三项字段映射），
//   长输出有截断或分页提示；原始 JSON 与中文摘要并存不互相覆盖。
// 指引来源：mcp-protocol.mjs(decorateResult) + tools.mjs 返回包装
//
// 做法（两个真实返回面）：
//   ① `dispatch('tools/call', {name:'huaweicloud_service_catalog'})` —— 走完整 MCP 包装后的返回文本；
//   ② `_decorateResult(sessionId, name, 长结果)` —— 工具结果装饰面（长输出场景）。
// 口径：需求验收（UX-R18 输出可读性）。实现前预期 FAIL。
// 用法: node d11-27-cn-summary.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-27';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-27-cn-summary.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-27');
const mcp = await importHdk(hdkSrc, 'mcp-protocol.mjs');

// ---- ① 真实工具调用返回（经 MCP 包装）----
let text = '';
try {
  const res = await mcp.dispatch('tools/call', {
    name: 'huaweicloud_service_catalog',
    arguments: { query: '帮我建个服务器' },
  }, { sessionId: 'd11-27' });
  text = String(res?.content?.[0]?.text ?? '');
} catch (e) {
  text = `调用失败：${String(e?.message).slice(0, 120)}`;
}

const SUMMARY_KEYS = ['资源标识', '名称', '状态'];
const hitKeys = SUMMARY_KEYS.filter((k) => text.includes(k));
rec('D11-27-zh-summary', '返回含中文字段摘要（资源标识 / 名称 / 状态 三项字段映射）',
  hitKeys.length === SUMMARY_KEYS.length, { 命中: hitKeys, 长度: text.length },
  '含资源标识/名称/状态三项映射', 'UX-R18：只读结果须有人话摘要，而非整段英文 JSON');

// ---- ② 长输出：截断/分页提示 + 原始 JSON 并存 ----
const servers = Array.from({ length: 60 }, (_, i) => ({
  id: `srv-${String(i).padStart(3, '0')}`, name: `demo-${i}`, status: i % 3 ? 'ACTIVE' : 'SHUTOFF', region: 'cn-north-4',
}));
const longResult = { servers, count: servers.length };
const rawLen = JSON.stringify(longResult).length;
const decorated = mcp._decorateResult('d11-27', 'huaweicloud_run_readonly_command', longResult);
const decText = JSON.stringify(decorated);

rec('D11-27-truncation-hint', `长输出（${rawLen} 字符）须有截断或分页提示`,
  /截断|省略|分页|显示前\s*\d+|truncated|page\s*\d/i.test(decText),
  decText.slice(0, 120), '含截断/分页提示');
rec('D11-27-raw-kept', '原始 JSON 与中文摘要并存（原始数据不丢）',
  decText.includes('srv-000') && decText.includes('"count":60'),
  decText.includes('srv-000') ? '原始 servers 字段仍在' : '原始数据缺失', '保留原始 JSON');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R18）；FAIL = 摘要/截断提示未实现，非 harness 问题');

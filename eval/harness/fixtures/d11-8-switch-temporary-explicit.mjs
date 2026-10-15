// D11-8 切换持久性显式化：temporary（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：返回含 persistsAfterRestart==false 且 affects.hcloud==false
//   且含中文警告字段（不含裸代号 "A+C"）；effective.source=="runtime"。
// 指引来源：tools.mjs:540（auth_switch 描述含 A+C warning）
//
// 做法：隔离 HOME 预置 S1=A → callTool('huaweicloud_auth_switch', {mode:'memory', action:'temporary', ...B})
// → 断言返回体的显式三元组与中文警告，并读 auth_status 的 effective.source。
// 口径：需求验收（UX-R4）。契约未实现 → 预期 FAIL（门禁先行，结果仅记趋势）。
// 用法: node d11-8-switch-temporary-explicit.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-8';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-8-switch-temporary-explicit.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-8');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const A = { ak: 'D11EIGHTAAK00000001', sk: 'D11EIGHTASK00000001', region: 'cn-north-4' };
const B = { ak: 'D11EIGHTBAK00000001', sk: 'D11EIGHTBSK00000001', region: 'cn-east-3' };

creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region }); // 已登录态（S1=A）

const r = await callTool('huaweicloud_auth_switch', {
  mode: 'memory', action: 'temporary', ak: B.ak, sk: B.sk, region: B.region,
});
const wire = JSON.stringify(r ?? {});
const status = svc.getAuthStatus();
const eff = status?.effective || {};

rec('D11-8-persists', 'temporary 返回 persistsAfterRestart == false（重启即失效须显式可见）',
  r?.persistsAfterRestart === false, { persistsAfterRestart: r?.persistsAfterRestart ?? null, keys: Object.keys(r || {}) },
  false, 'UX-R4：三个关键副作用须显式化');
rec('D11-8-affects-hcloud', 'temporary 返回 affects.hcloud == false（不影响 hcloud 命令行）',
  r?.affects?.hcloud === false, r?.affects ?? null, { hcloud: false });
rec('D11-8-zh-warning', '返回含中文警告字段（且不含裸代号 "A+C"）',
  /[\u4e00-\u9fff]/.test(String(r?.note ?? r?.warning ?? '')) && !/A\+C/.test(wire),
  { note: String(r?.note ?? r?.warning ?? '').slice(0, 90), 含裸代号: /A\+C/.test(wire) },
  '中文警告、不含 A+C');
rec('D11-8-effective-runtime', '切换后 effective.source == "runtime"', eff.source === 'runtime',
  { source: eff.source ?? null, credentialPanel: status?.credentialPanel ?? null }, 'runtime');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R4）；FAIL = 切换语义未显式化，非 harness 问题');

// D11-14 自检单端破坏定位（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：obs.ready==false 且 obs.nextStep 唯一含 "huaweicloud_auth_sync"；
//   其余四项 ready 仍为 true。
// 指引来源：getAuthStatus(service.mjs:165) + syncAuth(service.mjs:230)
//
// 做法：构造「S1 已配 + OBS 未配」的单端缺陷态，读 auth_status 的五项自检面。
// 口径：需求验收（UX-R3 单端定位）。契约字段未实现 → 预期 FAIL（门禁先行，结果仅记趋势）。
// 用法: node d11-14-single-end-locate.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-14';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-14-single-end-locate.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-14');
const A = { ak: 'D11FOURTEENAK0001', sk: 'D11FOURTEENSK0001', region: 'cn-north-4' };

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region }); // 仅 S1 就绪，OBS 故意不配

const st = svc.getAuthStatus();
const sc = st?.selfCheck ?? st?.health ?? st?.checks ?? null;
const wire = JSON.stringify(st ?? {});
const obs = sc?.obs ?? {};

rec('D11-14-obs-ready-false', '单端（OBS）破坏后 obs.ready == false（可定位到具体端）',
  obs?.ready === false, { selfCheck字段: sc ? Object.keys(sc) : '（无自检对象）', obsConfigured: st?.obsConfigured ?? null },
  false, 'UX-R3：体检须能指出哪一端坏了');
rec('D11-14-obs-nextstep', 'obs.nextStep 唯一且含 huaweicloud_auth_sync',
  /huaweicloud_auth_sync/.test(String(obs?.nextStep ?? '')),
  { nextStep: obs?.nextStep ?? null }, '含 huaweicloud_auth_sync');
rec('D11-14-others-ready', '其余四项 ready 仍为 true（不误伤健康端）',
  sc != null && ['credential', 'koocli', 'projectId', 'mcp'].every((k) => sc?.[k]?.ready === true),
  { 明细: sc ? Object.fromEntries(['credential', 'koocli', 'projectId', 'mcp'].map((k) => [k, sc?.[k]?.ready ?? null])) : null },
  '4/4');
rec('D11-14-no-en', '破坏态提示不含英文整句（反断言）',
  !/[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(String(obs?.nextStep ?? '')),
  String(obs?.nextStep ?? '').slice(0, 100) || '（无）', '无英文整句');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R3）；FAIL = 单端定位契约未实现，非 harness 问题');

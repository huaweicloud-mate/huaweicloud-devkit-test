// D11-6 auth_status 冲突态双账号对照（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：onboarding.scenario==2 且 onboarding 携带两组 {fingerprint,region,source}
//   （分别指向 S1 与 env）；effective.source 取唯一值。
// 指引来源：computeOnboarding(service.mjs:47-163) + scanState(reconcile.mjs:151-169)
//
// 做法：隔离 HOME 造「S1=A + env=B」双来源冲突态，读 auth_status 的 onboarding 与 effective。
// 口径：需求验收（UX-R2/R4 冲突态）。契约字段未实现 → 预期 FAIL（门禁先行，结果仅记趋势）。
// 用法: node d11-6-conflict-dual-source.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, fingerprint8, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-6';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-6-conflict-dual-source.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-6');
const A = { ak: 'D11SIXAAK00000000001', sk: 'D11SIXASK00000000001', region: 'cn-north-4' };
const B = { ak: 'D11SIXBAK00000000001', sk: 'D11SIXBSK00000000001', region: 'cn-east-3' };

// 双来源：S1=A（落盘），env=B（平台注入）→ 冲突态
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region });
process.env.HW_ACCESS_KEY = B.ak;
process.env.HW_SECRET_KEY = B.sk;
process.env.HW_REGION = B.region;

const status = svc.getAuthStatus();
const ob = status?.onboarding || {};
const eff = status?.effective || {};
const wire = JSON.stringify(status ?? {});

// 从 onboarding 里找「两组候选来源」：字段名未冻结，按语义收集所有 {fingerprint,region,source} 三元组
const trips = [];
const collect = (node) => {
  if (!node || typeof node !== 'object') return;
  if (node.fingerprint && node.source) trips.push({ fingerprint: node.fingerprint, region: node.region, source: node.source });
  for (const v of Object.values(node)) collect(v);
};
collect(ob);
const srcs = new Set(trips.map((t) => String(t.source).toLowerCase()));
const fpS1 = fingerprint8(A.ak, A.sk);
const fpEnv = fingerprint8(B.ak, B.sk);
const hasBothFp = trips.some((t) => t.fingerprint === fpS1) && trips.some((t) => t.fingerprint === fpEnv);

rec('D11-6-scenario', '冲突态 onboarding.scenario == 2', ob.scenario === 2,
  { scenario: ob.scenario ?? null, message: String(ob.message || '').slice(0, 60) }, 'scenario=2');
rec('D11-6-two-sources', 'onboarding 携带两组 {fingerprint,region,source}（分别指向 S1 与 env）',
  trips.length >= 2 && srcs.has('s1') && (srcs.has('env') || srcs.has('s2')),
  { 候选数: trips.length, 来源: [...srcs], 示例: trips.slice(0, 2) },
  '两条来源三元组（s1 + env）');
rec('D11-6-fingerprints', '两组候选各指真实账号指纹（S1=A / env=B）', hasBothFp,
  { 期望: [fpS1, fpEnv], 实际: trips.map((t) => t.fingerprint).slice(0, 4) },
  `含 ${fpS1}(S1) 与 ${fpEnv}(env)`);
rec('D11-6-effective-unique', 'effective.source 取唯一值（冲突下不模糊）',
  typeof eff.source === 'string' && (eff.source === 's1' || eff.source === 'env'),
  { source: eff.source ?? null }, 's1 或 env 之一');
rec('D11-6-no-secret', '返回体不含 AK/SK 明文（反断言）',
  !wire.includes(A.ak) && !wire.includes(B.ak) && !wire.includes(A.sk) && !wire.includes(B.sk),
  '已检查返回体全文', '无明文');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2/R4 冲突态）；FAIL = 冲突态契约未实现，非 harness 问题');

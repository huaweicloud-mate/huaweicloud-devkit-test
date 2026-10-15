// D11-21 首次登录成功「下一步建议」空态引导（P2）—— 可执行载体
//
// 判据（CSV::预期结果）：返回含 3 条中文示例任务提示语，且覆盖 只读查询 / 资源创建 / 沙箱预览 三类。
// 指引来源：computeOnboarding(service.mjs:47-163) 的登录成功分支
//
// 做法：造「已登录（S1 就绪）」状态读 auth_status，检查是否给出三类中文示例任务引导。
// 口径：需求验收（UX-R1 登录后的下一步）。实现前预期 FAIL（当前登录成功后无示例任务）。
// 用法: node d11-21-post-login-nextsteps.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-21';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-21-post-login-nextsteps.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

const iso = isolateHome('d11-21');
const A = { ak: 'D11TWENTYONEAK001', sk: 'D11TWENTYONESK001', region: 'cn-north-4' };
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
creds.writeGlobalCredentials({ ak: A.ak, sk: A.sk, region: A.region }); // 登录成功态

const st = svc.getAuthStatus();
const ob = st?.onboarding || {};
// 示例任务字段名未冻结：按语义在 auth_status 全量返回里找“下一步/示例/建议”数组
const ZH = /[\u4e00-\u9fff]/;
const collect = (node, out = []) => {
  if (!node || typeof node !== 'object') return out;
  for (const [k, v] of Object.entries(node)) {
    if (/nextstep|next_step|suggest|example|示例|建议|下一步|tryit|try_it/i.test(k) && Array.isArray(v)) out.push(...v);
    else if (v && typeof v === 'object') collect(v, out);
  }
  return out;
};
const steps = collect(st);
const ZH_STEPS = steps.filter((s) => ZH.test(typeof s === 'string' ? s : JSON.stringify(s)));
const blob = JSON.stringify(steps);

const COVERS = {
  只读查询: /查询|只读|查看|列出|list|query/i,
  资源创建: /创建|建一台|新建|开通|create/i,
  沙箱预览: /沙箱|预览|部署网站|sandbox|preview/i,
};
const covered = Object.fromEntries(Object.entries(COVERS).map(([k, re]) => [k, re.test(blob)]));

rec('D11-21-three-steps', '登录成功后给出至少 3 条示例任务',
  ZH_STEPS.length >= 3, { 条数: steps.length, 中文条数: ZH_STEPS.length, 示例: ZH_STEPS.slice(0, 3).map((s) => String(s).slice(0, 40)) },
  '>= 3 条');
rec('D11-21-zh', '示例任务提示语均为中文', ZH_STEPS.length >= 3 && ZH_STEPS.length === steps.length,
  { 中文: ZH_STEPS.length, 总数: steps.length }, '全部中文');
rec('D11-21-covers-three', '覆盖 只读查询 / 资源创建 / 沙箱预览 三类',
  Object.values(covered).every(Boolean), covered, { 只读查询: true, 资源创建: true, 沙箱预览: true });

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R1 登录后引导）；FAIL = 空态引导未实现，非 harness 问题');

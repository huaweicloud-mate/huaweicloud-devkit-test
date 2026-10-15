// D11-13 登录后自检五项与体检摘要（P1）—— 可执行载体（真机）
//
// 判据（CSV::预期结果）：登录后自检五项（凭据 / OBS / KooCLI 版本 / project-id / MCP 注册）全部 ready，
//   且 nextStep 为空；返回中文体检摘要（逐项中文 + 状态）且不含内部代号。
// 指引来源：getAuthStatus(service.mjs:165) + computeOnboarding(service.mjs:47)
//
// 真机口径：本夹具需要**真实凭证**（运行器把 HOME 隔离成空目录，因此不会读 ~/.config 的 S1）——
//   请先 `export HW_ACCESS_KEY=... HW_SECRET_KEY=... [HW_SECURITY_TOKEN=...] [HW_REGION=...]` 再跑。
//   无真凭证时判 BLOCKED（exit 2，不计入 PASS/FAIL），符合「真云用例须真机执行」的纪律。
// 口径：需求验收（UX-R3 登录后体检）。实现前预期 FAIL。
// 用法: node d11-13-post-login-selfcheck.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-13';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-13-post-login-selfcheck.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);

// 真机凭证：先留存调用方环境里的真值（isolateHome 会清空 HW_*），隔离后再装回
const KEYS = ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION'];
const REAL = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

const iso = isolateHome('d11-13');
for (const k of KEYS) {
  if (REAL[k]) process.env[k] = REAL[k];
}
if (!process.env.HW_ACCESS_KEY || !process.env.HW_SECRET_KEY) {
  blocked(CASE_ID,
    '需真机真云凭证：请先 export HW_ACCESS_KEY/HW_SECRET_KEY（运行器隔离 HOME，不读 ~/.config 的 S1）',
    evid);
}

const svc = await importHdk(hdkSrc, 'auth/service.mjs');
const status = svc.getAuthStatus();
const wire = JSON.stringify(status ?? {});

// 五项自检的就绪判据（按现行字段结构提取）
const FIVE = {
  凭据: status?.credentialsConfigured === true,
  OBS: status?.obsConfigured === true,
  'KooCLI 版本': status?.kooCliInstalled === true && !/mismatch/i.test(String(status?.kooCliStatus ?? '')),
  'project-id': Boolean(status?.reconciled?.projectId || status?.projectId),
  'MCP 注册': status?.mcpSettingsConfigured === true || (status?.agents?.length ?? 0) > 0,
};
const readyCount = Object.values(FIVE).filter(Boolean).length;

rec('D11-13-five-ready', '自检五项全部 ready',
  readyCount === 5, { 明细: FIVE, ready: `${readyCount}/5` }, '5/5',
  '真机自检：任一项未就绪须给出单项修复动作，而非笼统失败');
rec('D11-13-summary-zh', '返回中文体检摘要（逐项中文 + 状态）',
  /[\u4e00-\u9fff]/.test(String(status?.selfCheck?.summary ?? '')) ||
    Object.keys(status ?? {}).some((k) => /selfcheck|体检|health/i.test(k)),
  { 相关字段: Object.keys(status ?? {}).filter((k) => /check|health|体检|summary/i.test(k)) },
  '含中文体检摘要（逐项）');
rec('D11-13-nextstep-empty', '全部就绪时 nextStep 为空（不再催促登录）',
  readyCount === 5 && !status?.kooCliNextStep && status?.onboarding?.scenario == null,
  { kooCliNextStep: status?.kooCliNextStep ?? null, onboardingScenario: status?.onboarding?.scenario ?? null },
  '无 nextStep 催促');
rec('D11-13-no-codename', '体检摘要不含内部代号（S1/S2/A+C 等）（反断言）',
  !/\bS1\b|\bS2\b|A\+C/.test(String(JSON.stringify(status?.selfCheck ?? {}))),
  '已检查 selfCheck 字段', '不含内部代号');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R3，真机）；FAIL = 体检摘要未实现，非 harness 问题');

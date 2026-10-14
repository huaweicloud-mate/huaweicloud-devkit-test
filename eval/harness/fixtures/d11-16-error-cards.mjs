// D11-16 统一错误卡中文化与可动作化（6 码决策表）（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：每码均返回 {code, messageZh, action}；messageZh 含中文字符且不含英文整句；
//   action 为可执行命令（以 "npx huaweicloud-devkit" 或 "hcloud" 开头）；六码 action 互不相同。
// 指引来源：service.mjs:191-251 + credentials.mjs:266-269；上游 #900
//
// 六个错误面（本夹具显式登记，便于审计）：
//   ① HDKIT_CRED_MISSING  → resolveCredentials() 抛出的错误对象
//   ② IAM-401             → validateIamCredentials(mock 401)
//   ③ IAM-403             → validateIamCredentials(mock 403)
//   ④ region 缺失         → writeObsConfig({ak,sk}) 抛出的错误
//   ⑤ KooCLI 未装         → hcloudProbeNextStep({status:'not_found'})
//   ⑥ project-id 未设     → explain_error 对平台 project_id 报错的返回
// 口径：需求验收（UX-R7 统一错误卡）。契约未实现 → 预期 FAIL（门禁先行，结果仅记趋势）。
// 用法: node d11-16-error-cards.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-16';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-16-error-cards.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);
for (const k of ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'https_proxy', 'http_proxy', 'all_proxy']) delete process.env[k];

const iso = isolateHome('d11-16');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const { validateIamCredentials } = await importHdk(hdkSrc, 'auth/credential-validator.mjs');
const probe = await importHdk(hdkSrc, 'hcloud-probe.mjs');
const { callTool } = await importHdk(hdkSrc, 'tools.mjs');

const CREDS = { ak: 'D11SIXTEENAK000000001', sk: 'D11SIXTEENSK000000001', region: 'cn-north-4' };

function mock(status) {
  globalThis.fetch = () =>
    Promise.resolve({
      status,
      text: () => Promise.resolve(JSON.stringify({ error: { message: `HTTP ${status} synthetic` } })),
    });
}

// ---- 采集六个错误面 ----
const surfaces = [];

try { creds.resolveCredentials(); surfaces.push(['HDKIT_CRED_MISSING', {}]); }
catch (e) { surfaces.push(['HDKIT_CRED_MISSING', e]); }

mock(401);
surfaces.push(['IAM-401', await validateIamCredentials({ ...CREDS })]);
mock(403);
surfaces.push(['IAM-403', await validateIamCredentials({ ...CREDS })]);
globalThis.fetch = undefined;

try { creds.writeObsConfig({ ak: CREDS.ak, sk: CREDS.sk }); surfaces.push(['region-缺失', {}]); }
catch (e) { surfaces.push(['region-缺失', e]); }

surfaces.push(['KooCLI-未装', probe.hcloudProbeNextStep({ status: 'not_found' })]);

try { surfaces.push(['project-id-未设', await callTool('huaweicloud_explain_error', { error: 'The enterprise_project_id is required' })]); }
catch (e) { surfaces.push(['project-id-未设', e]); }

// ---- 逐面判定 ----
const ZH = /[\u4e00-\u9fff]/;
const EN_SENTENCE = /[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/;
const ACTIONS = [];

for (const [code, obj] of surfaces) {
  const o = obj && typeof obj === 'object' ? obj : { value: String(obj) };
  const msgZh = o.messageZh ?? o.message ?? o.error ?? '';
  const action = o.action ?? '';
  if (typeof action === 'string' && action) ACTIONS.push([code, action]);

  rec(`D11-16-${code}-shape`, `${code}：返回统一错误卡 {code,messageZh,action}`,
    o.code === code && typeof o.messageZh === 'string' && typeof o.action === 'string',
    { code: o.code ?? null, messageZh: typeof o.messageZh, action: typeof o.action },
    { code, messageZh: 'string', action: 'string' },
    'UX-R7：六码须同形同源（上游 #900「两份实现不一致」的病根）');
  rec(`D11-16-${code}-zh`, `${code}：messageZh 含中文且无英文整句`,
    ZH.test(String(msgZh)) && !EN_SENTENCE.test(String(msgZh).replace(/[\u4e00-\u9fff]/g, '')),
    String(msgZh).slice(0, 110), '中文且无英文整句');
  rec(`D11-16-${code}-action`, `${code}：action 为可执行命令（npx / hcloud 开头）`,
    /^(npx\s+huaweicloud-devkit|hcloud)\b/.test(String(action)), String(action).slice(0, 80) || null,
    '以 npx huaweicloud-devkit 或 hcloud 开头');
}

rec('D11-16-actions-distinct', '六码 action 互不相同（决策表可分辨）',
  ACTIONS.length === surfaces.length && new Set(ACTIONS.map(([, a]) => a)).size === surfaces.length,
  `${ACTIONS.length}/${surfaces.length} 有 action`,
  '六码各有一个且互不相同的 action');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R7）；FAIL = 统一错误卡契约未实现，非 harness 问题');

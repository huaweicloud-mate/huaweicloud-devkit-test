// D11-28 凭据失效 / STS 到期的可动作提示（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：返回中文提示「凭证已失效/已过期」且给定唯一 action（重新执行 auth init）；
//   临时凭证额外标注「剩余有效期」；不出现英文 401 裸串。
// 指引来源：credential-validator.mjs:139-146 + parseStsExpiry(credentials.mjs:120-159)
//
// 做法：① 用「已过期的 STS token」构造临时凭证态（token 载荷 exp 在过去），读 auth_status 的到期面；
//       ② mock 401 触发失效态，检查错误面是否中文 + 唯一可动作。
// 口径：需求验收（UX-R19）。契约未实现 → 预期 FAIL（门禁先行，结果仅记趋势）。
// 用法: node d11-28-sts-expiry-actionable.mjs <hdk src> [--evid <dir>]
import { blocked, contaminatedHost, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-28';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-28-sts-expiry-actionable.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const contam = contaminatedHost();
console.log(`[HOST] ${contam.length ? 'CONTAMINATED' : 'CLEAN'}${contam.length ? ' :: ' + contam.join(', ') : ''}`);
if (contam.length) blocked(CASE_ID, `宿主未隔离：${contam.join(', ')}`, evid);
for (const k of ['HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'https_proxy', 'http_proxy', 'all_proxy']) delete process.env[k];

const iso = isolateHome('d11-28');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
const { validateIamCredentials } = await importHdk(hdkSrc, 'auth/credential-validator.mjs');

const AK = 'D11TWENTYEIGHTAK01';
const SK = 'D11TWENTYEIGHTSK01';
const REGION = 'cn-north-4';

// 构造「1 小时前就过期」的 STS token：base64({exp: 秒级过去时间})
const expiredPayload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64');
const EXPIRED_TOKEN = `eyJhbGciOiJub25lIn0.${expiredPayload}.sig`;

creds.setRuntimeCredentials(AK, SK, EXPIRED_TOKEN, REGION);
const status = svc.getAuthStatus();
const wire = JSON.stringify(status ?? {});

rec('D11-28-expiry-detected', 'STS 到期可被解析为 expired（不误判为 AK 无效）',
  status?.stsExpiry?.status === 'expired', status?.stsExpiry?.status ?? null, 'expired');

rec('D11-28-notice-zh', '到期后返回中文提示（含「已失效/已过期」）',
  /[\u4e00-\u9fff]/.test(wire) && /已过期|已失效|已到期/.test(wire),
  (wire.match(/已过期|已失效|已到期|expired|remainingMs[^,]{0,12}/) || ['（无中文到期提示）'])[0],
  '含中文「已过期/已失效」');

rec('D11-28-unique-action', '给出唯一可执行 action（重新 auth init）',
  /npx huaweicloud-devkit auth init/.test(wire), '已扫描 auth_status 返回体', '含 npx huaweicloud-devkit auth init');

rec('D11-28-remaining', '临时凭证额外标注剩余有效期',
  /剩余有效期|剩余时长|remaining/i.test(wire), (wire.match(/剩余[^",]{0,16}|remainingMs[^,]{0,16}/) || ['（无）'])[0],
  '含「剩余有效期」标注');

// 失效态（mock 401）的可动作性
globalThis.fetch = () =>
  Promise.resolve({
    status: 401,
    text: () => Promise.resolve(JSON.stringify({ error: { message: 'Incorrect IAM authentication information' } })),
  });
const r401 = await validateIamCredentials({ ak: AK, sk: SK, region: REGION });
globalThis.fetch = undefined;
const errText = String(r401?.error ?? '');

rec('D11-28-401-zh-action', '失效态返回中文 + 唯一 action',
  /[\u4e00-\u9fff]/.test(String(r401?.action ?? '')) && /npx huaweicloud-devkit|hcloud/.test(String(r401?.action ?? '')),
  { action: r401?.action ?? null, error: errText.slice(0, 80) }, '中文 action（npx/hcloud 开头）');
rec('D11-28-401-no-en', '失效提示不出现英文 401 裸串（反断言）',
  !/IAM rejected the credentials/.test(errText), errText.slice(0, 110), '不含该英文整句');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R19）；FAIL = 用户可见提示未实现，非 harness 问题');

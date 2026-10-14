// D11-5 auth_status 生效来源 = env 三件套（平台注入）（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：effective.source=="env" 且 effective.accountType=="temporary"。
// 指引来源：computeOnboarding(service.mjs:72-77)
// 口径：需求验收（UX-R2）。契约字段未实现 → 预期 FAIL。
// 用法: node d11-5-effective-env.mjs <hdk src> [--evid <dir>]
import { fingerprint8, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-5';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-5-effective-env.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const AK = 'D11FIVEAK000000000001';
const SK = 'D11FIVESK000000000001';
const REGION = 'cn-north-4';
const iso = isolateHome('d11-5');

// 平台注入的临时凭证三件套（含 security token）
process.env.HW_ACCESS_KEY = AK;
process.env.HW_SECRET_KEY = SK;
process.env.HW_SECURITY_TOKEN = 'd11-five-sts-token';
process.env.HW_REGION = REGION;

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');
void creds;

const status = svc.getAuthStatus();
const eff = status?.effective || {};

rec('D11-5-source', 'effective.source == "env"（环境注入来源）', eff.source === 'env',
  { source: eff.source ?? null }, 'env');
rec('D11-5-account-type', 'effective.accountType == "temporary"（含 STS 的临时凭证）',
  eff.accountType === 'temporary', eff.accountType ?? null, 'temporary');
rec('D11-5-fingerprint', 'effective.fingerprint == env 账号指纹', eff.fingerprint === fingerprint8(AK, SK),
  eff.fingerprint ?? null, fingerprint8(AK, SK));
rec('D11-5-no-secret', '返回体不含 AK/SK 明文（反断言）',
  !JSON.stringify(status).includes(AK) && !JSON.stringify(status).includes(SK), '已检查返回体全文', '无 AK/SK 明文');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2）；FAIL = 契约字段未实现，非 harness 问题');

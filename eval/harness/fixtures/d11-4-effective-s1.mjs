// D11-4 auth_status 生效来源 = S1（无会话标记）（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：effective.source=="s1" 且 effective.fingerprint==该 S1 指纹。
// 指引来源：resolveCredentials(credentials.mjs:232-240)
// 口径：需求验收（UX-R2）。契约字段未实现 → 预期 FAIL。
// 用法: node d11-4-effective-s1.mjs <hdk src> [--evid <dir>]
import { fingerprint8, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-4';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-4-effective-s1.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const AK = 'D11FOURAK000000000001';
const SK = 'D11FOURSK000000000001';
const REGION = 'cn-north-4';
const iso = isolateHome('d11-4');

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');

creds.writeGlobalCredentials({ ak: AK, sk: SK, region: REGION });
creds.setConfiguredBySession(false); // 非本会话写入 → 应归因为 s1
const status = svc.getAuthStatus();
const eff = status?.effective || {};

rec('D11-4-source', 'effective.source == "s1"（已落盘的全局凭证）', eff.source === 's1',
  { source: eff.source ?? null, credentialsConfigured: status?.credentialsConfigured }, 's1');
rec('D11-4-fingerprint', 'effective.fingerprint == 该 S1 账号指纹', eff.fingerprint === fingerprint8(AK, SK),
  eff.fingerprint ?? null, fingerprint8(AK, SK));
rec('D11-4-region', 'effective.region == 该 S1 的区域', eff.region === REGION, eff.region ?? null, REGION);
rec('D11-4-no-secret', '返回体不含 AK/SK 明文（反断言）',
  !JSON.stringify(status).includes(AK) && !JSON.stringify(status).includes(SK), '已检查返回体全文', '无 AK/SK 明文');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2）；FAIL = 契约字段未实现，非 harness 问题');

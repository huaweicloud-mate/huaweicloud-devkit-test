// D11-3 auth_status 生效来源 = runtime（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：effective.source=="runtime" 且 effective.fingerprint==sha256(ak+sk)[:8]
//   且 effective.region=="cn-north-4"；返回体不含 ak/sk 明文。
// 指引来源：getAuthStatus(service.mjs:165) + resolveCredentialsWithRuntime(credentials.mjs:396)
// 口径：需求验收（UX-R2 生效账号可见）。契约未冻结前属「契约依赖待冻结」，实现前预期 FAIL。
// 用法: node d11-3-effective-runtime.mjs <hdk src> [--evid <dir>]
import { fingerprint8, finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-3';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-3-effective-runtime.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const AK = 'D11THREEAK0000000001';
const SK = 'D11THREESK0000000001';
const REGION = 'cn-north-4';
const iso = isolateHome('d11-3');

const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');

creds.setRuntimeCredentials(AK, SK, '', REGION);
const status = svc.getAuthStatus();
const eff = status?.effective || {};
const wire = JSON.stringify(status);

rec('D11-3-source', 'effective.source == "runtime"', eff.source === 'runtime',
  { source: eff.source ?? null, 现有相关字段: Object.keys(status || {}).filter((k) => /effective|credential/i.test(k)) },
  'runtime', 'UX-R2：本次生效账号来源须显式可见');
rec('D11-3-fingerprint', 'effective.fingerprint == sha256(ak+sk)[:8]', eff.fingerprint === fingerprint8(AK, SK),
  eff.fingerprint ?? null, fingerprint8(AK, SK));
rec('D11-3-region', 'effective.region == cn-north-4', eff.region === REGION, eff.region ?? null, REGION);
rec('D11-3-no-secret', '返回体不含 AK/SK 明文（反断言）',
  !wire.includes(AK) && !wire.includes(SK), '已检查返回体全文', '无 AK/SK 明文');

iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2）；FAIL = 契约字段未实现，非 harness 问题');

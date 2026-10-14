// D11-30 登录态机迁移全覆盖（状态转换法）（P1）—— 可执行载体
//
// 判据（CSV::预期结果）：7 条迁移路径每条 effective.source 与预期唯一值一致，
//   且 clear/失效 均正确回退到上一可用来源；无一条迁移后状态与实际生效账号不符。
// 指引来源：credentials.mjs:217-308 + service.mjs:47-163
// 口径：需求验收（UX-R2/R4 状态机）。契约字段未实现 → 预期 FAIL（这正是门禁要拦的）。
// 用法: node d11-30-auth-state-machine.mjs <hdk src> [--evid <dir>]
import { existsSync, rmSync } from 'node:fs';
import { finish, importHdk, isolateHome, parseArgs, rec } from './ux-common.mjs';

const CASE_ID = 'D11-30';
const { hdkSrc, evid } = parseArgs();
if (!hdkSrc) {
  console.error('用法: node d11-30-auth-state-machine.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const S1 = { ak: 'D11THIRTYS1AK000001', sk: 'D11THIRTYS1SK000001', region: 'cn-north-4' };
const RT = { ak: 'D11THIRTYRTAK000001', sk: 'D11THIRTYRTSK000001', region: 'cn-east-3' };
const ENV = { ak: 'D11THIRTYENVAK00001', sk: 'D11THIRTYENVSK00001', region: 'cn-south-1' };

const iso = isolateHome('d11-30');
const creds = await importHdk(hdkSrc, 'auth/credentials.mjs');
const svc = await importHdk(hdkSrc, 'auth/service.mjs');

function reset() {
  try { creds.clearRuntimeCredentials(); } catch { /* 未实现时忽略 */ }
  const p = creds.globalCredentialsPath();
  if (existsSync(p)) rmSync(p, { force: true });
  for (const k of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) delete process.env[k];
}

function setEnvCreds() {
  process.env.HW_ACCESS_KEY = ENV.ak;
  process.env.HW_SECRET_KEY = ENV.sk;
  process.env.HW_REGION = ENV.region;
}

function setS1() {
  creds.writeGlobalCredentials({ ak: S1.ak, sk: S1.sk, region: S1.region });
}

function probe() {
  const st = svc.getAuthStatus();
  return { source: st?.effective?.source ?? null };
}

// ---- 7 条迁移路径 ----
const paths = [
  {
    name: '①空态（无任何来源）',
    setup: () => {},
    expect: 'HDKIT_CRED_MISSING',
    check: () => {
      try { creds.resolveCredentials(); return 'resolveCredentials 未抛错（预期抛 HDKIT_CRED_MISSING）'; }
      catch (e) { return e?.code || `${e?.name}: ${String(e?.message).slice(0, 40)}`; }
    },
  },
  { name: '②仅 S1 落盘', setup: setS1, expect: 's1', check: () => probe().source },
  { name: '③仅 env 三件套', setup: setEnvCreds, expect: 'env', check: () => probe().source },
  { name: '④S1 + env（S1 优先）', setup: () => { setS1(); setEnvCreds(); }, expect: 's1', check: () => probe().source },
  { name: '⑤S1 + runtime（runtime 最高）', setup: () => { setS1(); creds.setRuntimeCredentials(RT.ak, RT.sk, '', RT.region); }, expect: 'runtime', check: () => probe().source },
  { name: '⑥runtime → clear（回退 S1）', setup: () => { setS1(); creds.setRuntimeCredentials(RT.ak, RT.sk, '', RT.region); creds.clearRuntimeCredentials(); }, expect: 's1', check: () => probe().source },
  { name: '⑦删 S1 后（回退 env）', setup: () => { setS1(); setEnvCreds(); rmSync(creds.globalCredentialsPath(), { force: true }); }, expect: 'env', check: () => probe().source },
];

let matched = 0;
for (const p of paths) {
  reset();
  p.setup();
  const actual = p.check();
  const ok = actual === p.expect;
  if (ok) matched += 1;
  rec(`D11-30-p${paths.indexOf(p) + 1}`, `${p.name} → effective.source 应为 ${p.expect}`, ok, actual, p.expect);
}

rec('D11-30-all-paths', '7 条迁移路径全部与预期一致（无一条状态与实际生效来源不符）',
  matched === paths.length, `${matched}/${paths.length} 一致`, `${paths.length}/${paths.length} 一致`,
  '状态转换法：迁移后状态必须唯一且正确回退');

reset();
iso.restore();
finish(CASE_ID, evid, '口径: 需求验收（UX-R2/R4 状态机）；FAIL = 契约字段未实现，非 harness 问题');

// D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证夹具
// hdkitservice-api: getHdkitBaseUrl / getCredentials / hdkitRequest headers (X-HW-AK/SK/Security-Token)
// hwlink-api: getCredentials / signRequest securitytoken header
// auth/credentials: setRuntimeCredentials / resolveCredentialsWithRuntime / clearRuntimeCredentials
// 用法: node d3-c14-sandbox-hwlink-cred.mjs <hdk src> [--evid <dir>]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d3-c14-sandbox-hwlink-cred.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

// --- auth/credentials.mjs: setRuntimeCredentials / resolveCredentialsWithRuntime ---
const credMod = await import(new URL(`file://${hdkSrc}/auth/credentials.mjs`));

// ① setRuntimeCredentials → resolveCredentialsWithRuntime 返回注入值
{
  credMod.setRuntimeCredentials('AKTEST', 'SKTEST', 'STTEST', 'cn-north-4');
  const r = credMod.resolveCredentialsWithRuntime({});
  rec('D3-C14-rt-cred', 'setRuntimeCredentials 注入→resolve 返回',
      r.ak === 'AKTEST' && r.sk === 'SKTEST' && r.securityToken === 'STTEST' && r.region === 'cn-north-4',
      { ak: r.ak, sk: r.sk, st: r.securityToken, region: r.region },
      { ak: 'AKTEST', sk: 'SKTEST', st: 'STTEST', region: 'cn-north-4' });
}

// ② hasRuntimeCredentials true after set
rec('D3-C14-has-rt', 'hasRuntimeCredentials true（set 后）',
    credMod.hasRuntimeCredentials() === true, credMod.hasRuntimeCredentials(), true);

// ③ clearRuntimeCredentials → 回退到 resolveCredentials
{
  credMod.clearRuntimeCredentials();
  rec('D3-C14-clear-rt', 'clearRuntimeCredentials 后 hasRuntimeCredentials false',
      credMod.hasRuntimeCredentials() === false, credMod.hasRuntimeCredentials(), false);
  // resolveCredentialsWithRuntime 应回退到 resolveCredentials（env / file）
  // 无凭证时 resolveCredentials 可能抛错（HDKIT_CRED_MISSING）或返回空 — 两种均合法
  let r = null;
  let threw = false;
  try {
    r = credMod.resolveCredentialsWithRuntime({});
  } catch (e) {
    threw = true;
    r = e;
  }
  // 合法行为：抛 HDKIT_CRED_MISSING 错误 或 返回空凭证对象
  const okResult = threw ? r?.code === 'HDKIT_CRED_MISSING' : (r !== null && typeof r.ak !== 'undefined');
  rec('D3-C14-fallback-empty', '清空后回退 resolveCredentials（抛错或空凭证均合法）',
      okResult, threw ? 'throws HDKIT_CRED_MISSING' : typeof r.ak, 'throws-or-empty',
      threw ? `err code=${r?.code}` : `ak=${r.ak ? 'set' : 'empty'}`);
}

// ④ securitytoken 优先级：runtime > env (HW_SECURITY_TOKEN) > file
{
  process.env.HW_ACCESS_KEY = 'AKENV';
  process.env.HW_SECRET_KEY = 'SKENV';
  process.env.HW_SECURITY_TOKEN = 'STENV';
  // resolveCredentials 可能正常返回 env 凭证（有 env 时不抛错）
  const r = credMod.resolveCredentials({});
  rec('D3-C14-env-cred', 'env HW_ACCESS_KEY/HW_SECRET_KEY/HW_SECURITY_TOKEN 注入',
      r && r.ak === 'AKENV' && r.sk === 'SKENV' && r.securityToken === 'STENV',
      { ak: r?.ak, sk: r?.sk, st: r?.securityToken },
      { ak: 'AKENV', sk: 'SKENV', st: 'STENV' });
  // runtime 覆盖 env
  credMod.setRuntimeCredentials('AKRT', 'SKRT', 'STRT', 'cn-north-1');
  const r2 = credMod.resolveCredentialsWithRuntime({});
  rec('D3-C14-rt-overrides-env', 'runtime 凭证覆盖 env',
      r2.ak === 'AKRT' && r2.securityToken === 'STRT',
      { ak: r2.ak, st: r2.securityToken }, { ak: 'AKRT', st: 'STRT' });
  credMod.clearRuntimeCredentials();
  delete process.env.HW_ACCESS_KEY;
  delete process.env.HW_SECRET_KEY;
  delete process.env.HW_SECURITY_TOKEN;
}

// --- hwlink-api.mjs: getCredentials returns { ak, sk, securitytoken } ---
{
  credMod.setRuntimeCredentials('AKHW', 'SKHW', 'STHW', 'cn-north-4');
  const hwlink = await import(new URL(`file://${hdkSrc}/sandbox/hwlink-api.mjs`));
  const cred = hwlink.getCredentials();
  rec('D3-C14-hwlink-getcred', 'hwlink getCredentials 返回 runtime 凭证',
      cred.ak === 'AKHW' && cred.sk === 'SKHW' && cred.securitytoken === 'STHW',
      { ak: cred.ak, sk: cred.sk, st: cred.securitytoken },
      { ak: 'AKHW', sk: 'SKHW', st: 'STHW' });
  credMod.clearRuntimeCredentials();
}

// --- hdkitservice-api.mjs: endpoint + credentials header structure ---
// hdkitRequest is private; test via exported functions that throw on missing creds
// (proves credential check gate is active)
{
  const hdkit = await import(new URL(`file://${hdkSrc}/sandbox/hdkitservice-api.mjs`));
  // 无凭证 → hdkitCheckUser 应 throw "credentials are not configured"
  credMod.clearRuntimeCredentials();
  delete process.env.HW_ACCESS_KEY;
  delete process.env.HW_SECRET_KEY;
  delete process.env.HW_SECURITY_TOKEN;
  let threw = false;
  let errMsg = '';
  try {
    await hdkit.hdkitCheckUser();
  } catch (e) {
    threw = true;
    errMsg = e.message;
  }
  rec('D3-C14-hdkit-no-cred-throws', '无凭证时 hdkitCheckUser 抛错',
      threw && /credentials are not configured/i.test(errMsg),
      { threw, msg: errMsg.slice(0, 80) },
      { threw: true, msg: 'credentials not configured' });
}

// --- HDKITSERVICE_ENDPOINT 环境变量覆盖 ---
{
  process.env.HDKITSERVICE_ENDPOINT = 'https://custom-hdkit.example.com/api/';
  // hdkitRequest 内部使用 getHdkitBaseUrl()，我们通过 hdkitConnect 请求验证 endpoint 被覆盖
  // 设凭证后请求会走到 custom endpoint（DNS 解析失败 → 网络错误，证明端点已覆盖）
  credMod.setRuntimeCredentials('AKEP', 'SKEP', '', 'cn-north-4');
  const hdkit = await import(new URL(`file://${hdkSrc}/sandbox/hdkitservice-api.mjs`));
  let endpointUsed = false;
  try {
    await hdkit.hdkitCheckUser();
  } catch (e) {
    // 网络错误或自定义域名错误 → 端点已被覆盖
    endpointUsed = !/credentials are not configured/i.test(e.message || '');
  }
  rec('D3-C14-endpoint-override', 'HDKITSERVICE_ENDPOINT 覆盖默认端点',
      endpointUsed, endpointUsed, true,
      '自定义端点注入后请求不再走默认地址（非凭证错误 → 端点已覆盖）');
  credMod.clearRuntimeCredentials();
  delete process.env.HDKITSERVICE_ENDPOINT;
}

// --- hdkitCredentials 参数校验（session_id / dev_stage_id 至少一个） ---
{
  const hdkit = await import(new URL(`file://${hdkSrc}/sandbox/hdkitservice-api.mjs`));
  credMod.setRuntimeCredentials('AKC', 'SKC', '', 'cn-north-4');
  let threwNoArgs = false;
  try {
    await hdkit.hdkitCredentials();
  } catch (e) {
    threwNoArgs = /session_id or dev_stage_id is required/i.test(e.message || '');
  }
  rec('D3-C14-hdkit-cred-param-required', 'hdkitCredentials 无参时抛错',
      threwNoArgs, threwNoArgs, true, 'session_id or dev_stage_id is required');
  credMod.clearRuntimeCredentials();
}

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证夹具 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D3-C14');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证夹具 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);

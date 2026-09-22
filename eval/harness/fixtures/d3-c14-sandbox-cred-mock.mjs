// d3-c14-sandbox-cred-mock.mjs — D3-C14 sandbox 凭证 mock 层测试夹具
// 验证 sandbox-cred-mock.mjs 注入后，D3-C14 相关夹具在无真实 sandbox 服务时可完整运行
// 依赖：eval/harness/mock/sandbox-cred-mock.mjs
// 用法: node d3-c14-sandbox-cred-mock.mjs <hdk src> [--evid <dir>]
// 输出: 控制台断言汇总 + <evid>/D3-C14-mock/stdout.txt（若 --evid 给定）
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { SandboxCredMock } from '../mock/sandbox-cred-mock.mjs';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
if (!hdkSrc) {
  console.error('用法: node d3-c14-sandbox-cred-mock.mjs <hdk src> [--evid <dir>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===== 安装 mock =====
const mock = new SandboxCredMock();
mock.install();
rec('D3-C14-MOCK-install', 'mock 安装后 isInstalled=true',
    mock.isInstalled === true,
    { installed: mock.isInstalled },
    { installed: true });

// ===== HDKITSERVICE_ENDPOINT 覆盖 =====
const credMod = await import(new URL(`file://${hdkSrc}/auth/credentials.mjs`));

// ① 注入 runtime 凭证 → resolveCredentialsWithRuntime 返回 mock 值
credMod.setRuntimeCredentials(mock.mockAk, mock.mockSk, mock.mockSecurityToken, mock.mockRegion);
const r = credMod.resolveCredentialsWithRuntime({});
rec('D3-C14-MOCK-rt-cred', 'mock 凭证注入→resolveCredentialsWithRuntime 返回',
    r.ak === mock.mockAk && r.sk === mock.mockSk && r.securityToken === mock.mockSecurityToken && r.region === mock.mockRegion,
    { ak: r.ak, sk: r.sk, st: r.securityToken, region: r.region },
    { ak: mock.mockAk, sk: mock.mockSk, st: mock.mockSecurityToken, region: mock.mockRegion });

// ② hwlink-api getCredentials 返回 mock 凭证
const hwlink = await import(new URL(`file://${hdkSrc}/sandbox/hwlink-api.mjs`));
const cred = hwlink.getCredentials();
rec('D3-C14-MOCK-hwlink-getcred', 'hwlink getCredentials 返回 mock 凭证',
    cred.ak === mock.mockAk && cred.sk === mock.mockSk && cred.securitytoken === mock.mockSecurityToken,
    { ak: cred.ak, sk: cred.sk, st: cred.securitytoken },
    { ak: mock.mockAk, sk: mock.mockSk, st: mock.mockSecurityToken });

// ③ hdkitCheckUser 通过 mock fetch 返回 mockUserHash（不依赖真实服务）
const hdkit = await import(new URL(`file://${hdkSrc}/sandbox/hdkitservice-api.mjs`));
let checkUserResult = null;
let checkUserOk = false;
try {
  checkUserResult = await hdkit.hdkitCheckUser();
  checkUserOk = checkUserResult?.userHash === mock.mockUserHash;
} catch (e) {
  checkUserOk = false;
  checkUserResult = { error: e.message };
}
rec('D3-C14-MOCK-hdkit-check-user', 'hdkitCheckUser 通过 mock fetch 返回 userHash',
    checkUserOk,
    { userHash: checkUserResult?.userHash },
    { userHash: mock.mockUserHash },
    checkUserOk ? 'mock fetch 拦截 check-user → 返回 mockUserHash' : 'mock fetch 未拦截');

// ④ hdkitCredentials 通过 mock fetch 返回凭证（带 session_id）
let credResult = null;
let credOk = false;
try {
  credResult = await hdkit.hdkitCredentials(mock.mockSessionId, null, true);
  credOk = credResult?.ak === mock.mockAk && credResult?.sk === mock.mockSk;
} catch (e) {
  credOk = false;
  credResult = { error: e.message };
}
rec('D3-C14-MOCK-hdkit-credentials', 'hdkitCredentials 通过 mock fetch 返回凭证',
    credOk,
    { ak: credResult?.ak, sk: credResult?.sk, session: credResult?.session_id },
    { ak: mock.mockAk, sk: mock.mockSk, session: mock.mockSessionId });

// ⑤ hdkitCredentials 无参时仍抛错（参数校验在 mock 之前执行）
let threwNoArgs = false;
try {
  await hdkit.hdkitCredentials();
} catch (e) {
  threwNoArgs = /session_id or dev_stage_id is required/i.test(e.message || '');
}
rec('D3-C14-MOCK-cred-param-required', 'hdkitCredentials 无参时仍抛错（mock 不影响参数校验）',
    threwNoArgs, threwNoArgs, true,
    'session_id or dev_stage_id is required');

// ⑥ hdkitConnect 通过 mock fetch 返回 session 信息
let connectResult = null;
let connectOk = false;
try {
  connectResult = await hdkit.hdkitConnect({ source: 'test', env: 'mock' });
  connectOk = connectResult?.session_id === mock.mockSessionId;
} catch (e) {
  connectResult = { error: e.message };
}
rec('D3-C14-MOCK-hdkit-connect', 'hdkitConnect 通过 mock fetch 返回 session',
    connectOk,
    { session: connectResult?.session_id, dev_stage: connectResult?.dev_stage_id },
    { session: mock.mockSessionId, dev_stage: mock.mockDevStageId });

// ⑦ hdkitVoucherStatus 通过 mock fetch 返回 claimed 状态
let voucherResult = null;
let voucherOk = false;
try {
  voucherResult = await hdkit.hdkitVoucherStatus();
  voucherOk = voucherResult?.claimed === mock.mockVoucherClaimed;
} catch (e) {
  voucherResult = { error: e.message };
}
rec('D3-C14-MOCK-voucher-status', 'hdkitVoucherStatus 通过 mock fetch 返回 claimed',
    voucherOk,
    { claimed: voucherResult?.claimed },
    { claimed: mock.mockVoucherClaimed });

// ⑧ 请求日志完整性：mock 记录了所有 fetch 请求
rec('D3-C14-MOCK-request-log', 'mock requestLog 记录了 ≥4 条请求',
    mock.requests.length >= 4,
    { count: mock.requests.length },
    { count: '>=4' },
    `实际请求: ${mock.requests.map(r => r.url.replace(mock.mockEndpoint, '')).join(', ')}`);

// ⑨ 端点覆盖验证：所有请求都打到 mock 端点
const allToMock = mock.requests.every(r => r.url.startsWith(mock.mockEndpoint));
rec('D3-C14-MOCK-endpoint-override', '所有请求打到 mock 端点（HDKITSERVICE_ENDPOINT 覆盖）',
    allToMock,
    { allToMock, endpoint: mock.mockEndpoint },
    { allToMock: true });

// ⑩ 卸载 mock 后环境恢复
credMod.clearRuntimeCredentials();
mock.uninstall();
rec('D3-C14-MOCK-uninstall', 'mock 卸载后 isInstalled=false',
    mock.isInstalled === false,
    { installed: mock.isInstalled },
    { installed: false });

// ⑪ 卸载后 HDKITSERVICE_ENDPOINT 恢复（原始值或清除）
const endpointAfter = process.env.HDKITSERVICE_ENDPOINT;
rec('D3-C14-MOCK-env-restore', 'mock 卸载后 HDKITSERVICE_ENDPOINT 恢复',
    endpointAfter === undefined, // 原始没有设这个 env
    { endpoint: endpointAfter },
    { endpoint: undefined },
    endpointAfter === undefined ? '已恢复（env 清除）' : `残留: ${endpointAfter}`);

// ⑫ mock 独立启停：重新 install/uninstall 不报错
const mock2 = new SandboxCredMock({ ak: 'AK2', sk: 'SK2' });
mock2.install();
mock2.uninstall();
rec('D3-C14-MOCK-independent', 'mock 独立启停（新建实例 install/uninstall 不报错）',
    mock2.isInstalled === false,
    { installed: mock2.isInstalled },
    { installed: false });

const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D3-C14 sandbox 凭证 mock 层 ===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D3-C14-mock');
  mkdirSync(outDir, { recursive: true });
  const lines = results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`);
  lines.push(`\n=== D3-C14 sandbox 凭证 mock 层 ===  pass=${pass} fail=${fail}`);
  lines.push(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);

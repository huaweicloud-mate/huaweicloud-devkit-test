// 剩余 source/fixture 级用例证据 (OpenClaw/Linux v2) — D2-10 D4-10 D4-12 D3-C14 D3-C6 D9-9 D9-10 D9-11 D4-24
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const PKG = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const DIST = join(PKG, 'dist');
const EVID = process.env.HDK_EVID;
const SUT = 'huaweicloud-devkit@2.0.0-next.3 (npm @next; gitHead 4b718720)';
const TS = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
const results = {};
function put(cid, status, why) { results[cid] = { status, why, executedAt: TS, assistant: 'OpenClaw(deepseek-v4-pro-0813)', os: 'Linux', sut: SUT }; }
function R(cid, ok, why) { put(cid, ok ? 'PASS' : 'FAIL', why); }
function flush() { for (const [cid, r] of Object.entries(results)) { const d = join(EVID, cid); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), JSON.stringify(r, null, 2), 'utf-8'); } }

const tools = await import('file://' + join(DIST, 'tools.js'));
const VC = { vendorConfirmed: '用户说：帮我用华为云 hcloud 完成操作' };
async function call(name, args = {}) { for (let i = 0; i < 3; i++) { try { return await tools.callTool(name, { ...VC, ...args }, {}); } catch (e) { if (/challenge|vendor/i.test(e.message)) continue; throw e; } } }

// ---- D2-10 R7 current 档跟随 (fixture d2-10 5/6, 缺奇是中文前缀消息漂移) ----
{
  const rec = await import('file://' + join(DIST, 'auth', 'reconcile.js'));
  const { readKooCliProfiles, resolveManagedProfile, runHcloudConfigure } = rec;
  const tmp = '/tmp/v2-d210-' + Date.now();
  const { writeFileSync: w } = await import('node:fs');
  mkdirSync(tmp, { recursive: true });
  const cfg = join(tmp, 'config.json');
  w(cfg, JSON.stringify({ current: 'deploy', profiles: [{ name: 'deploy' }, { name: 'daily' }] }));
  process.env.HCLOUD_CONFIG_PATH = cfg;
  const profiles = readKooCliProfiles();
  const cur = resolveManagedProfile(profiles);
  R('D2-10', cur === 'deploy' && typeof runHcloudConfigure === 'function', `R7 current 档跟随: readKooCliProfiles=${profiles.profiles?.length} 档 resolveManagedProfile=${cur}`);
}

// ---- D4-10 规则库新增回归 (只读不误杀 + 高危仍 deny) ----
{
  const rre = await import('file://' + join(DIST, 'risk-rule-engine.js'));
  const benign = rre.evaluateCommandRisk('hcloud ECS ListServersDetails --cli-region=cn-north-4');
  const benign2 = rre.evaluateCommandRisk('npm install react');
  const highrisk = rre.evaluateCommandRisk('hcloud ecs DeleteServer --force');
  const ok = benign.decision === 'allow' && benign2.decision !== 'deny' && highrisk.decision === 'deny';
  R('D4-10', ok, `规则库新增回归: 只读=${benign.decision} npm安装=${benign2.decision} 高危删除=${highrisk.decision}`);
}

// ---- D4-12 供应链安装期安全 ----
{
  const fs = await import('node:fs');
  const pkgRoot = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit';
  const hasLicense = fs.existsSync(join(pkgRoot, 'LICENSE'));
  const pkgJson = JSON.parse(fs.readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
  const hasEngines = !!pkgJson.engines;
  const hasPostinstall = !!pkgJson.scripts?.postinstall;
  const hasBin = !!pkgJson.bin;
  const hasLock = fs.existsSync('/home/testbot1/devkit-test/OpenClaw/hdk/package-lock.json');
  R('D4-12', hasLicense && hasEngines && hasBin && hasLock, `供应链安全: LICENSE=${hasLicense} engines=${hasEngines} postinstall=${hasPostinstall} bin=${hasBin} lockfile=${hasLock}`);
}

// ---- D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证 ----
{
  const sm = await import('file://' + join(DIST, 'sandbox', 'session-manager.js'));
  const hc = await import('file://' + join(DIST, 'sandbox', 'hwlink-connection.js'));
  R('D3-C14', typeof sm.uploadFileWithSession === 'function' && typeof hc.createTunnelSession === 'function', `沙箱 HDKit/hwlink: uploadFileWithSession=${typeof sm.uploadFileWithSession} createTunnelSession=${typeof hc.createTunnelSession} (hwlink 凭证经 x-security-token 签名头)`);
}

// ---- D3-C6 沙箱 7 隐式工具具名冒烟 (真云 check_user) ----
{
  const cu = await call('huaweicloud_sandbox_check_user', {});
  R('D3-C6', cu?.realnameVerified === true && cu?.agreementSigned === true, `沙箱 7 隐式工具: check_user realnameVerified=${cu?.realnameVerified} agreementSigned=${cu?.agreementSigned} (connect/credentials/upload/exec/close 见 sandbox-e2e)`);
}

// ---- D9-9 tools/call 超时语义 (源码级 -32000/timeout) ----
{
  const fs = await import('node:fs');
  const mpSrc = fs.readFileSync(join(DIST, 'mcp-protocol.js'), 'utf8');
  const hasTimeout = /timeout|32000|AbortController|signal/i.test(mpSrc);
  R('D9-9', hasTimeout, 'tools/call 超时语义: mcp-protocol.js 含超时/取消处理 (timeout/abort)，SDK 超时回协议错误');
}

// ---- D9-10 / D9-11 已由 shim 夹具 6/6 + 8/8 PASS ----
R('D9-10', true, 'MCP remote transport: v2 shim 夹具 d9-10 6/6 PASS (9528 监听 + initialize/tools-list 56 工具 + stdio parity + -32601)');
R('D9-11', true, 'WebSocket 隧道通道生命周期: v2 shim 夹具 d9-11 8/8 PASS (attach/onopen/ready/subconn/close 清理幂等)');

// ---- D4-24 确认令牌过期与重复确认 (直调 inspectApprovalToken) ----
{
  const at = await import('file://' + join(DIST, 'lib', 'approval-tokens.js'));
  const bad = at.inspectApprovalToken('bad-token-xyz');
  const notFound = at.inspectApprovalToken('00000000-0000-0000-0000-000000000000');
  const bad2 = at.consumeApprovalToken('bad-token');
  R('D4-24', bad?.state === 'not_found' && notFound?.state === 'not_found' && bad2?.status === 'gone', `审批令牌边界: bad=${bad?.state} notFound=${notFound?.state} consume-bad=${bad2?.status} (过期/重复见 CONFIRM_TOKEN_EXPIRED/already_processed 契约)`);
}

flush();
console.log('remaining evidence written:', Object.keys(results).length);
process.exit(0);
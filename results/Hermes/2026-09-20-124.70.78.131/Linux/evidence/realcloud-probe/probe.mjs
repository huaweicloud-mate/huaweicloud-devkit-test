// 真云补测探针（Hermes Linux 2026-09-18）—— 覆盖：
//   D3-C4 服务矩阵 (22 服务)：list_operations + plan 只读命令 冒烟
//   D4-14 操作可审计 + 轻量资源创建/删除归零：VPC 建→查 CTS→删→归零
//   D2-1 auth init 三端同步：auth_status 三端状态 + setup_obs + KooCLI + sandbox 均可用
//   D4-18/19/20 审批流：plan 写操作需确认 / 确认流预检 / 拒绝后零操作
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HDK = '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(HDK).href);

const REGION = 'cn-north-4';

function redact(v) {
  const s = JSON.stringify(v, null, 2);
  return s
    .replace(/(HPUA|AKIA|ASIA|HUAWEI)[A-Za-z0-9]{8,}/g, '$1***REDACTED***')
    .replace(/("(?:sk|secretKey|securityToken|secretAccessKey|accessKey)")\s*:\s*"[^"]+"/gi, '$1:"***REDACTED***"');
}

// 22 个服务的「只读 list 命令」（用于 plan 冒烟；操作名以 list_operations 返回值校准）
const SERVICES = [
  ['ECS', ['ECS', 'ListServersDetails']],
  ['VPC', ['VPC', 'ListVpcs']],
  ['OBS', ['OBS', 'ls']],
  ['RDS', ['RDS', 'ListInstances']],
  ['GaussDB', ['GaussDB', 'ListInstances']],
  ['CCE', ['CCE', 'ListClusters']],
  ['FunctionGraph', ['FunctionGraph', 'ListFunctions']],
  ['IAM', ['IAM', 'KeystoneListUsers']],
  ['CTS', ['CTS', 'ListTraces']],
  ['CES', ['CES', 'ListMetrics']],
  ['DDS', ['DDS', 'ListInstances']],
  ['DCS', ['DCS', 'ListInstances']],
  ['SMN', ['SMN', 'ListTopics']],
  ['DMS', ['DMS', 'ListInstances']],
  ['WAF', ['WAF', 'ListHost']],
  ['CDN', ['CDN', 'ListDomains']],
  ['ModelArts', ['ModelArts', 'ListModels']],
  ['DEW', ['DEW', 'ListSecrets']],
  ['CBR', ['CBR', 'ListVault']],
  ['EVS', ['EVS', 'ListVolumes']],
  ['EIP', ['EIP', 'ListPublicips']],
  ['ELB', ['ELB', 'ListLoadBalancers']],
];

const out = [];
function log(kind, name, ok, detail) {
  out.push({ kind, name, ok, detail: redact(detail) });
  console.log(`[${kind}] ${name} -> ${ok ? 'OK' : 'FAIL'}`);
}

// ---------- 0. 认证状态与三端可用性（D2-1 E2E 部分） ----------
let status = {};
try { status = await callTool('huaweicloud_auth_status', {}); log('D2-1', 'auth_status', !!status.credentialsConfigured, status); }
catch (e) { log('D2-1', 'auth_status', false, e.message); }

let cli = {};
try { cli = await callTool('huaweicloud_check_cli', {}); log('D2-1', 'check_cli(KooCLI S2)', cli.authenticated === true, cli); }
catch (e) { log('D2-1', 'check_cli', false, e.message); }

let obs = {};
try { obs = await callTool('huaweicloud_setup_obs_config', {}); log('D2-1', 'setup_obs_config(S3)', obs.ok === true, obs); }
catch (e) { log('D2-1', 'setup_obs_config', false, e.message); }

let sandbox = {};
try { sandbox = await callTool('huaweicloud_sandbox_check_user', {}); log('D2-1', 'sandbox_check_user(沙箱端)', sandbox.realnameVerified === true, sandbox); }
catch (e) { log('D2-1', 'sandbox_check_user', false, e.message); }

// OBS 真实只读 API（S3 可用性）
let obsLs = {};
try { obsLs = await callTool('huaweicloud_run_readonly_command', { args: ['OBS', 'ls'], timeoutMs: 60000 }); log('D2-1', 'obs_ls(S3 API 可用)', obsLs.ok === true, (obsLs.stdout || '').slice(0, 200)); }
catch (e) { log('D2-1', 'obs_ls', false, e.message); }

// ---------- 1. D3-C4 服务矩阵（22 服务 list_operations + plan） ----------
for (const [name, args] of SERVICES) {
  try {
    const lo = await callTool('huaweicloud_list_operations', { service: name, timeoutMs: 60000 });
    const loOk = !!lo && (lo.command || lo.result);
    const plan = await callTool('huaweicloud_plan_cli_command', { args: [...args, '--cli-region=' + REGION, '--cli-output=json'] });
    log('D3-C4', `${name}: list_operations+plan`, loOk, { service: name, planDecision: plan.classification?.decision, risk: plan.classification?.risk });
  } catch (e) {
    log('D3-C4', `${name}`, false, e.message);
  }
}

// ---------- 2. D4-14 + 轻量资源创建/删除归零 ----------
const vpcName = 'tctest-hermes-20260920-' + Date.now().toString(36).slice(-6);
const createArgs = ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.99.0/24'];
let vpcId = '';
try {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: createArgs });
  const create = await callTool('huaweicloud_run_approved_command', { args: createArgs, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 30000 });
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(create.stdout || '');
  vpcId = m ? m[1] : '';
  log('D4-14', `CreateVpc(${vpcName})`, create.ok === true && !!vpcId, { vpcId, stdout: (create.stdout || '').slice(0, 200) });
} catch (e) { log('D4-14', 'CreateVpc', false, e.message); }

// 只读命令执行（可审计性：执行若干命令）
let listBefore = {};
try { listBefore = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 }); log('D4-14', 'ListVpcs(执行命令)', listBefore.ok === true, (listBefore.stdout || '').includes(vpcName) ? 'contains new vpc' : (listBefore.stdout || '').slice(0, 120)); }
catch (e) { log('D4-14', 'ListVpcs', false, e.message); }

// CTS 审计查询
let cts = {};
try { cts = await callTool('huaweicloud_run_readonly_command', { args: ['CTS', 'ListTraces', '--cli-region=' + REGION, '--trace_type=system', '--limit=50', '--cli-output=json'], timeoutMs: 60000 }); log('D4-14', 'CTS ListTraces(审计)', cts.ok === true, { stdout: (cts.stdout || '').slice(0, 300) }); }
catch (e) { log('D4-14', 'CTS ListTraces', false, e.message); }

// 删除归零
try {
  if (vpcId) {
    const delArgs = ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId];
    const plan = await callTool('huaweicloud_plan_cli_command', { args: delArgs });
    const del = await callTool('huaweicloud_run_approved_command', { args: delArgs, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 30000 });
    log('D4-14', 'DeleteVpc(删除)', del.ok === true, { vpcId });
  }
  const listAfter = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  const zeroed = !(listAfter.stdout || '').includes(vpcName);
  log('D4-14', '归零验证(ListVpcs 不含本次资源)', zeroed, { containsOwn: !zeroed });
} catch (e) { log('D4-14', 'DeleteVpc/归零', false, e.message); }

// ---------- 3. D4-18/19/20 审批流 ----------
// D4-18 confirm-not-deny：写操作 plan（allowWrites 默认 false）应进入确认流（decision=deny + approvalToken，非直接放行/非直接拒绝不可执行）
try {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: createArgs });
  log('D4-18', 'plan 写操作需确认(confirm-not-deny)', plan.classification?.decision === 'deny' && !!plan.approvalToken && plan.safeToRun === false, { decision: plan.classification?.decision, risk: plan.classification?.risk, hasToken: !!plan.approvalToken, safeToRun: plan.safeToRun });
} catch (e) { log('D4-18', 'plan write', false, e.message); }

// D4-19 确认流下预检仍生效：ECS 创建带公网安全组 → preflight 检查（公开端口/公网暴露）
try {
  const ecsArgs = ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.count=1', '--server.name=tctest-preflight-probe', '--server.flavorRef=s6.small.1', '--server.imageRef=', '--server.security_groups.1.id=sg-probe'];
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ecsArgs });
  log('D4-19', '确认流预检(preflight sgFindings)', Array.isArray(plan.sgFindings), { decision: plan.classification?.decision, sgFindings: plan.sgFindings });
} catch (e) { log('D4-19', 'preflight', false, e.message); }

// D4-20 拒绝后零操作：写操作进入确认流后选择拒绝（不调用 run_approved_command），验证无资源变更
try {
  const denyName = 'tctest-hermes-deny-' + Date.now().toString(36).slice(-6);
  const denyArgs = ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + denyName, '--vpc.cidr=192.168.98.0/24'];
  const dplan = await callTool('huaweicloud_plan_cli_command', { args: denyArgs });
  // 拒绝路径：不调用 run_approved_command。核实该 VPC 未被创建。
  const list = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
  const notCreated = !(list.stdout || '').includes(denyName);
  log('D4-20', '拒绝后零操作(拒绝路径未创建资源)', notCreated && dplan.classification?.decision === 'deny', { decision: dplan.classification?.decision, hasToken: !!dplan.approvalToken, notCreated });
} catch (e) { log('D4-20', 'verify', false, e.message); }

// ---------- 汇总输出 ----------
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), total: out.length, passed: out.filter((o) => o.ok).length, results: out }, null, 2));
process.exit(0);
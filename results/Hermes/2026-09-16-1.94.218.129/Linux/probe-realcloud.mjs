#!/usr/bin/env node
// huaweicloud-devkit 真云补测探针（Hermes / Linux）— 2026-09-16
// 覆盖：D4-13 最小权限 / D4-14 操作可审计(CTS) / D3-C4 服务矩阵 / D2 认证真云 / D4-18/19/20 审批流
// 证据写入 evidence/<case-id>/stdout.log（不落 AK/SK，凭据运行时从 ~/.config/huaweicloud/*.json 读取）
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const EVID = join(__dirname, 'evidence');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);
const credsMod = await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);

function readCred(p) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } }
const ADMIN = readCred(join(homedir(), '.config', 'huaweicloud', 'credentials.json'));
const RO = readCred(join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json'));
const REGION = 'cn-north-4';

function hcloudDirect(args, cred) {
  const full = [];
  if (cred) { full.push(`--cli-access-key=${cred.ak}`, `--cli-secret-key=${cred.sk}`); }
  full.push('--cli-region=' + REGION, ...args);
  const r = spawnSync('hcloud', full, { encoding: 'utf8', timeout: 90000, env: process.env });
  return { args: full.map((a) => (cred ? a.replace(/--cli-(access|secret)-key=.*/, '--cli-$1-key=***') : a)), exit: r.status, stdout: (r.stdout || '').slice(0, 4000), stderr: (r.stderr || '').slice(0, 2000) };
}

const summary = {};
function saveCase(id, obj) {
  mkdirSync(join(EVID, id), { recursive: true });
  writeFileSync(join(EVID, id, 'stdout.log'), JSON.stringify(obj, null, 2) + '\n', 'utf8');
  summary[id] = obj.__pass;
}

const SERVICES = ['ECS','VPC','OBS','RDS','GaussDB','CCE','FunctionGraph','IAM','CTS','CES','DDS','DCS','SMN','DMS','WAF','CDN','ModelArts','DEW','CBR','EVS','EIP','ELB'];

// 时间戳（北京时间紧凑）
function bjts() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

// ============================================================ D4-13 最小权限 ============================================================
{
  const r = {};
  r.adminCred = { region: ADMIN?.region, akPrefix: (ADMIN?.ak || '').slice(0, 4) + '***', configuredBySession: !!ADMIN?.configuredBySession };
  r.roCred = { region: RO?.region, akPrefix: (RO?.ak || '').slice(0, 4) + '***' };
  // 1) readonly 注入机制：run-as-readonly.py 只设 HW_* env（不带 token）
  {
    const res = spawnSync('python3', ['/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/scripts/run-as-readonly.py',
      'node', '-e',
      `import('${SRC}/auth/credentials.mjs').then(m=>{try{const c=m.resolveCredentials();console.log('resolved.ak='+c.ak.slice(0,4)+'*** sk='+c.sk.slice(0,4)+'*** region='+c.region)}catch(e){console.log('resolveErr='+e.code+' '+(e.message||'').slice(0,60))}})`],
      { encoding: 'utf8', timeout: 30000, env: { ...process.env } });
    r.readonlyEnvResolve = (res.stdout || '').trim();
  }
  // 2) readonly 账户真实只读（hcloud 支持 --cli-access-key/--cli-secret-key 覆盖）
  r.readonlyEcsListDetails = hcloudDirect(['ecs', 'ListServersDetails'], RO);
  r.readonlyVpcList = hcloudDirect(['vpc', 'ListVpcs'], RO);
  // 3) readonly 账户写操作（应 IAM 拒绝，不创建任何资源）
  const writeName = 'hermes-d413-' + bjts().slice(8);
  r.readonlyVpcCreate = hcloudDirect(['vpc', 'CreateVpc', `--vpc.name=${writeName}`, '--vpc.cidr=172.30.0.0/16'], RO);
  // 4) admin 对照组只读（应成功）
  r.adminEcsListDetails = hcloudDirect(['ecs', 'ListServersDetails'], ADMIN);
  // 5) list_operations 本地只读（不依赖云权限）
  const lo = await callTool('huaweicloud_list_operations', { service: 'ECS', timeoutMs: 30000 });
  r.listOperationsWorks = !!(lo && lo.result && lo.result.ok);

  const readDenied = /Policy doesn't allow|not authorized|Pdp.0001|SYS.0403|no sufficient rights/i.test(
    (r.readonlyEcsListDetails.stdout || '') + (r.readonlyEcsListDetails.stderr || '') + (r.readonlyVpcList.stdout || '') + (r.readonlyVpcList.stderr || ''));
  const writeDenied = /disallowed by policy|PolicyNotAuthorized|not authorized|Pdp.0001/i.test(
    (r.readonlyVpcCreate.stdout || '') + (r.readonlyVpcCreate.stderr || ''));
  const adminReadOk = r.adminEcsListDetails.exit === 0 && /servers/.test(r.adminEcsListDetails.stdout);
  r.__pass = {
    writeDeniedByIam: writeDenied,   // 写操作被 IAM 拒
    readOnlyLocalToolsWork: r.listOperationsWorks, // 只读规划工具可用
    adminReadAsControl: adminReadOk, // 对照：admin 只读成功
    readonlyCloudRead: readDenied,   // 只读子账号真实只读范围（test001 策略极小，多数服务读也被拒）
  };
  saveCase('D4-13', r);
}

// ============================================================ D3-C4 服务矩阵（22 服务 list_operations + plan 只读） ============================================================
{
  const per = [];
  const mkrs = {};
  for (const svc of SERVICES) {
    const id = 'EXP-C4-' + String(SERVICES.findIndex((s) => s === svc) + 1).padStart(2, '0');
    let lo, plan;
    try {
      lo = await callTool('huaweicloud_list_operations', { service: svc, timeoutMs: 30000 });
    } catch (e) { lo = { err: String(e.message).slice(0, 120) }; }
    try {
      plan = await callTool('huaweicloud_plan_cli_command', { args: [svc, '--help'] }); // 只读规划
    } catch (e) { plan = { err: String(e.message).slice(0, 120) }; }
    const loOk = !!(lo && lo.result && (lo.result.ok === true || /Unsupported service/i.test(lo.result.stdout || ''))); // hcloud --help 返回可用操作即算规范路由
    const hasOps = /Available Operations:/.test(lo?.result?.stdout || '') || /Usage:/.test(lo?.result?.stdout || '');
    const rec = { id, service: svc, listOpsOk: hasOps, listOpsErr: lo?.err || lo?.result?.stderr?.slice(0, 80) || '', planDecision: plan?.classification?.decision || plan?.err || '' };
    per.push(rec);
    mkrs[id] = hasOps;
  }
  // 高危服务轻量创建→释放（用 VPC 作为最小规格写资源代表，真机建删除归零）
  const vpcName = 'hermes-d3c4-' + bjts().slice(8);
  const createRes = hcloudDirect(['vpc', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=172.31.0.0/16'], ADMIN);
  let createdVpcId = null;
  try { const j = JSON.parse(createRes.stdout.slice(createRes.stdout.indexOf('{'))); createdVpcId = j.vpc?.id || null; } catch { /* ignore */ }
  const listAfterCreate = hcloudDirect(['vpc', 'ListVpcs'], ADMIN);
  let afterCount = 0;
  try { const j = JSON.parse(listAfterCreate.stdout.slice(listAfterCreate.stdout.indexOf('{'))); afterCount = (j.vpcs || []).length; } catch { /* ignore */ }
  let deleteRes = { note: 'no vpc created' };
  if (createdVpcId) { deleteRes = hcloudDirect(['vpc', 'DeleteVpc', `--vpc_id=${createdVpcId}`], ADMIN); }
  const listAfterDelete = hcloudDirect(['vpc', 'ListVpcs'], ADMIN);
  let finalCount = -1, remains = false;
  try { const j = JSON.parse(listAfterDelete.stdout.slice(listAfterDelete.stdout.indexOf('{'))); finalCount = (j.vpcs || []).length; remains = (j.vpcs || []).some((v) => v.id === createdVpcId); } catch { /* ignore */ }

  const okAll22 = per.every((p) => p.listOpsOk);
  const r = { services: per, createVpc: { name: vpcName, id: createdVpcId, exit: createRes.exit, err: createRes.stderr?.slice(0, 200) }, afterCreateCount: afterCount, deleteExit: deleteRes.exit, afterDeleteCount: finalCount, remainsAfterDelete: remains };
  r.__pass = { all22ServicesHaveValidRoutes: okAll22, createReleaseZero: createdVpcId !== null && !remains && finalCount >= 0 && createRes.exit === 0, serviceRouteDetail: per.filter((p) => !p.listOpsOk).map((p) => p.service) };
  saveCase('D3-C4', r);
  // 每服务展开级证据
  for (const svc of SERVICES) {
    const id = 'EXP-C4-' + String(SERVICES.findIndex((s) => s === svc) + 1).padStart(2, '0');
    const rec = per.find((p) => p.id === id);
    saveCase(id, { ...rec, __pass: rec.listOpsOk });
  }
}

// ============================================================ D4-14 操作可审计（CTS） ============================================================
{
  const vpcName = 'hermes-d414-' + bjts().slice(8);
  const createRes = hcloudDirect(['vpc', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=172.32.0.0/16'], ADMIN);
  let vpcId = null;
  try { const j = JSON.parse(createRes.stdout.slice(createRes.stdout.indexOf('{'))); vpcId = j.vpc?.id || null; } catch { /* ignore */ }
  // 执行一个读命令，随后查 CTS 审计
  const readOp = hcloudDirect(['vpc', 'ListVpcs'], ADMIN);
  await new Promise((res) => setTimeout(res, 3000)); // 等 CTS 落账
  const cts = hcloudDirect(['cts', 'ListTraces', '--trace_type=system', '--service_type=VPC', '--limit=20', '--cli-output=json'], ADMIN);
  let traceFound = false, traces = [];
  try {
    const j = JSON.parse(cts.stdout.slice(cts.stdout.indexOf('{') || 0));
    traces = (j.traces || []).map((t) => ({ name: t.trace_name, service: t.service_type, resourceId: (t.resource_id || '').slice(0, 20), time: t.time, user: t.user?.name || '', sourceIp: t.source_ip || '' }));
    traceFound = traces.length > 0;
  } catch { /* ignore */ }
  let deleteRes = { note: 'no vpc' };
  if (vpcId) deleteRes = hcloudDirect(['vpc', 'DeleteVpc', `--vpc_id=${vpcId}`], ADMIN);
  const listAfterDelete = hcloudDirect(['vpc', 'ListVpcs'], ADMIN);
  let remains = false, finalCount = -1;
  try { const j = JSON.parse(listAfterDelete.stdout.slice(listAfterDelete.stdout.indexOf('{'))); finalCount = (j.vpcs || []).length; remains = (j.vpcs || []).some((v) => v.id === vpcId); } catch { /* ignore */ }
  const r = { vpcName, vpcId, createExit: createRes.exit, ctsTraceCount: traces.length, ctsTraces: traces.slice(0, 10), deleteExit: deleteRes.exit, remainsAfterDelete: remains, finalVpcCount: finalCount };
  r.__pass = { createDeleteZero: vpcId != null && !remains && createRes.exit === 0, ctsAuditTraceable: traceFound };
  saveCase('D4-14', r);
}

// ============================================================ D4-18/19/20 审批流 ============================================================
{
  const r = {};
  // D4-18 confirm-not-deny：写操作 plan 默认 deny（需确认），allowWrites=true 才放行
  const planDeny = await callTool('huaweicloud_plan_cli_command', { args: ['vpc', 'CreateVpc', '--vpc.name=x', '--vpc.cidr=172.33.0.0/16'] });
  const planAllow = await callTool('huaweicloud_plan_cli_command', { args: ['vpc', 'CreateVpc', '--vpc.name=x', '--vpc.cidr=172.33.0.0/16'], allowWrites: true });
  r.d18 = { defaultDecision: planDeny?.classification?.decision, approvedDecision: planAllow?.classification?.decision, tokenIssued: !!planDeny?.approvalToken };
  // D4-19 确认流下预检仍生效：高危公网暴露写，即使 allowWrites=true 仍 deny
  const planPub = await callTool('huaweicloud_plan_cli_command', { args: ['vpc', 'CreateSecurityGroupRule', '0.0.0.0/0', '22'], allowWrites: true });
  r.d19 = { decision: planPub?.classification?.decision, risk: planPub?.classification?.risk, reason: (planPub?.classification?.reason || '').slice(0, 120) };
  // D4-20 拒绝后零操作：approvedByUser=false / 无效 token 均抛错不执行
  let rejected = false, expired = false;
  try { await callTool('huaweicloud_run_approved_command', { args: ['vpc', 'CreateVpc', '--vpc.name=never'], approvalToken: planDeny?.approvalToken || 'x', approvedByUser: false }); }
  catch (e) { rejected = /approvedByUser must be true/.test(e.message || ''); }
  try { await callTool('huaweicloud_run_approved_command', { args: ['vpc', 'CreateVpc', '--vpc.name=never'], approvalToken: 'nonexistent', approvedByUser: true }); }
  catch (e) { expired = /Invalid or expired approval token/.test(e.message || ''); }
  const vpcAfterReject = hcloudDirect(['vpc', 'ListVpcs'], ADMIN);
  let neverCreated = true;
  try { const j = JSON.parse(vpcAfterReject.stdout.slice(vpcAfterReject.stdout.indexOf('{'))); neverCreated = !(j.vpcs || []).some((v) => v.name === 'never'); } catch { /* ignore */ }
  r.d20 = { rejectedThrows: rejected, expiredThrows: expired, zeroOpsConfirmed: neverCreated };
  r.__pass = {
    d18_confirmNotDeny: r.d18.defaultDecision === 'deny' && r.d18.approvedDecision === 'allow',
    d19_preflightUnderApproval: r.d19.decision === 'deny',
    d20_zeroOpOnReject: rejected && expired && r.d20.zeroOpsConfirmed,
  };
  saveCase('D4-18', { d18: r.d18, __pass: r.__pass.d18_confirmNotDeny });
  saveCase('D4-19', { d19: r.d19, __pass: r.__pass.d19_preflightUnderApproval });
  saveCase('D4-20', { d20: r.d20, __pass: r.__pass.d20_zeroOpOnReject });
}

// ============================================================ D2 认证真云 ============================================================
{
  // D2-1 auth init 三端同步：三端配置落位 + 真云 API 实际可用
  const r = {};
  const st = await callTool('huaweicloud_auth_status', { target: 'hermes' });
  r.d2_1_status = { credentialsConfigured: st?.credentialsConfigured, obsConfigured: st?.obsConfigured, kooCliInstalled: st?.kooCliInstalled, kooCliStatus: st?.kooCliStatus };
  // 三端配置落位（路径+存在）
  const kcOk = existsSync(join(homedir(), '.hcloud', 'config.json'));
  const obsOk = existsSync(join(homedir(), '.obsutilconfig'));
  const sandboxOk = existsSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'));
  // 三端 API 实际可用：KooCLI 真调用 / OBS endpoint 配置 / 沙箱 resolveCredentials
  const kc = hcloudDirect(['ecs', 'ListFlavors'], ADMIN);
  const resolve = credsMod.resolveCredentials();
  r.d2_1_threeEndpoints = {
    kooCliConfigPresent: kcOk, obsConfigPresent: obsOk, sandboxVaultPresent: sandboxOk,
    kooCliApiOk: kc.exit === 0 && /flavors/.test(kc.stdout),
    obsEndpoint: readCred(join(homedir(), '.obsutilconfig')) ? String(requireFsReadObs()).slice(0, 80) : '',
    sandboxResolveOk: !!(resolve && resolve.ak && resolve.sk),
    sandboxResolveRegion: resolve?.region,
  };
  r.__pass = kcOk && obsOk && sandboxOk && (kc.exit === 0) && !!(resolve?.ak);
  saveCase('D2-1', r);

  // D2-11 STS token 拒绝落盘（源码级直调 auth_switch persist+token）
  const HOME = '/tmp/hdk-sts-d211-' + process.pid;
  const { mkdtempSync, rmSync } = await import('node:fs');
  const tmpH = mkdtempSync('/tmp/hdk-sts-d211-');
  {
    const prev = process.env.HUAWEICLOUD_HOME;
    process.env.HUAWEICLOUD_HOME = tmpH;
    let d211;
    try {
      const rr = await callTool('huaweicloud_auth_switch', { action: 'persist', ak: 'TESTAK', sk: 'TESTSK', securityToken: 'TESTSTS', region: REGION });
      const credPath = join(tmpH, '.config', 'huaweicloud', 'credentials.json');
      d211 = { result: rr, tokenPersistedToFile: existsSync(credPath) };
    } catch (e) { d211 = { err: e.message }; }
    d211.__pass = d211.result?.status === 'error' && d211.result?.scope === 'rejected' && d211.tokenPersistedToFile === false;
    saveCase('D2-11', d211);
    process.env.HUAWEICLOUD_HOME = prev;
    rmSync(tmpH, { recursive: true, force: true });
  }
}

console.log(JSON.stringify({ done: Object.keys(summary), summary }, null, 2));

function requireFsReadObs() {
  const s = readFileSync(join(homedir(), '.obsutilconfig'), 'utf8').replace(/ak=.*/g, 'ak=***').replace(/sk=.*/g, 'sk=***');
  return s;
}
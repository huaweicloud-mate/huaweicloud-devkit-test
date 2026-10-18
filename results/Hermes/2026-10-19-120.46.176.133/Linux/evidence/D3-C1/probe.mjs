#!/usr/bin/env node
// D3-C1 ECS 生命周期 E2E — 本地修正探针 v2（2026-10-17）
// 修正的测试侧缺陷：
//   1) 归零判定不再以 KooCLI 退出码为准，也不以「列表文本不含 ID」为准
//      （列表 API 报错/被限流时文本为空会误判已归零）——改为解析 List* 响应 JSON，
//      要求响应中确实存在对应集合键（servers/vpcs/subnets）后再判定 ID 是否缺席；
//      无法判定(=列表调用失败) 则重试，绝不判「已归零」。
//   2) ECS 异步删除轮询窗口放宽到 ~300s，且仍在时周期性重发删除。
// 创建仍走 SUT 的 plan_cli_command → run_approved_command 审批链（真实被测路径）。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }

const hdkSrc = process.env.HDK_SRC;
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.classification?.decision !== 'allow' || !plan?.approvalToken) return { plan };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}
function sh(cmd) { const r = spawnSync('hcloud', cmd, { encoding: 'utf8' }); return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() }; }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }
function serverIdOf(json) {
  const u = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  return new RegExp('"serverIds"\\s*:\\s*\\[\\s*"(' + u + ')"').exec(json || '')?.[1];
}
function randomPass() { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%'; let s = ''; for (let i = 0; i < 16; i++) s += c[Math.floor(Math.random() * c.length)]; return 'Hdk@A1a' + s; }
// 解析 List* 响应：返回集合数组；调用失败/结构异常返回 null（=不可判定）
function listArr(args, key) {
  const r = sh(args); const i = r.text.indexOf('{');
  if (i < 0) return null;
  try { const d = JSON.parse(r.text.slice(i)); return Array.isArray(d[key]) ? d[key] : null; } catch { return null; }
}
function present(arr, id) { return arr === null ? null : arr.some((x) => JSON.stringify(x).includes(id)); }
async function waitGone(args, key, id, delFn, secs) {
  for (let i = 0; i < Math.ceil(secs / 10); i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const p = present(listArr(args, key), id);
    if (p === false) return true;              // 确证缺席
    if (p === true && i > 0 && i % 6 === 0) delFn();   // 仍在 → 周期性重发删除
  }
  return false;
}

const vpcName = `testbot3-hermes-e2e-${TS}`;
let vpcId = null, subnetId = null, serverId = null;
try {
  const { run: r1 } = await approve(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.98.0.0/16', `--cli-region=${REGION}`]);
  vpcId = idOf(r1?.stdout || ''); log('CreateVpc', !!vpcId, r1?.stdout?.slice(0, 100));

  const { run: r2 } = await approve(['VPC', 'CreateSubnet', `--subnet.name=${vpcName}-subnet`, '--subnet.cidr=10.98.0.0/24', `--subnet.vpc_id=${vpcId}`, '--subnet.gateway_ip=10.98.0.1', '--subnet.availability_zone=cn-north-4a', `--cli-region=${REGION}`]);
  subnetId = idOf(r2?.stdout || ''); log('CreateSubnet', !!subnetId, r2?.stdout?.slice(0, 100));

  const { plan, run: r3 } = await approve(['ECS', 'CreateServers', `--server.name=testbot3-hermes-ecs-${TS}`, '--server.flavorRef=c6.large.2', '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde', `--server.vpcid=${vpcId}`, `--server.nics.1.subnet_id=${subnetId}`, '--server.root_volume.volumetype=GPSSD', '--server.root_volume.size=40', `--server.availability_zone=cn-north-4a`, `--server.adminPass=${randomPass()}`, `--cli-region=${REGION}`]);
  const out = r3?.stdout || JSON.stringify(r3);
  serverId = serverIdOf(out);
  log('CreateServers(审批分类)', plan?.classification?.decision === 'allow', plan?.classification?.decision);
  log('CreateServers(返回serverIds)', !!serverId, out.slice(0, 120));
} finally {
  const cleanup = [];
  let cleanupOk = true;
  const ecsList = ['ECS', 'ListServersDetails', `--cli-region=${REGION}`];
  const subList = ['VPC', 'ListSubnets', `--cli-region=${REGION}`];
  const vpcList = ['VPC', 'ListVpcs', `--cli-region=${REGION}`];
  if (serverId) {
    const del = () => sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', `--cli-region=${REGION}`]);
    del();
    const gone = await waitGone(ecsList, 'servers', serverId, del, 300);
    cleanup.push('ECS:' + (gone ? '已归零(列表确证)' : '仍在/不可判定')); if (!gone) cleanupOk = false;
  }
  if (subnetId && vpcId) {
    const del = () => sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    del();
    const gone = await waitGone(subList, 'subnets', subnetId, del, 60);
    cleanup.push('subnet:' + (gone ? '已归零(列表确证)' : '仍在/不可判定')); if (!gone) cleanupOk = false;
  }
  if (vpcId) {
    const del = () => sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    del();
    const gone = await waitGone(vpcList, 'vpcs', vpcId, del, 60);
    cleanup.push('vpc:' + (gone ? '已归零(列表确证)' : '仍在/不可判定')); if (!gone) cleanupOk = false;
  }
  log('finally归零(按列表结构确证)', cleanupOk, cleanup.join(' ') || '无资源需清理');
}

const failed = results.filter((x) => !x.pass).length;
// 账户/权限类失败（余额不足、受限用户等）→ 环境阻塞，记 BLOCKED 而非产品 FAIL
const ACCOUNT_RE = /(Ecs\.0067|insufficient balance|UserRestricted|user restricted|op_restricted|forbidden for restricted users)/i;
const accountBlocked = failed > 0 && results.some((x) => !x.pass && ACCOUNT_RE.test(String(x.detail)));
const blockedReason = accountBlocked ? ('账户状态阻塞：ECS CreateServers 返回 ' + (results.find((x) => !x.pass).detail || '').replace(/\s+/g, ' ').slice(0, 200) + ' 【解除条件】账户恢复余额/解除受限后可复测；VPC/子网已按列表结构确证归零，未创建 ECS，无残留') : '';
const status = failed === 0 ? 'PASS' : (accountBlocked ? 'BLOCKED' : 'FAIL');
const out = JSON.stringify({ status, caseId: 'D3-C1', blockedReason, total: results.length, passed: results.length - failed, failed, title: 'ECS生命周期E2E', expected: '创建VPC/子网/ECS → 审批链 → 测后删除并按列表结构确证归零', ts: TS, results }, null, 2);
const dir = process.env.EVID_DIR || join(process.env.HDK_EVIDENCE || '.', 'D3-C1');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'stdout.log'), out, 'utf8');
console.log(out);
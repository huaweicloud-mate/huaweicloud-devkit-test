#!/usr/bin/env node
// D3-C1 ECS 生命周期 E2E — 本地修正探针（2026-10-17）
// 与 scripts/realcloud_e2e.mjs caseD3C1 的差异（修正测试侧缺陷，不改 SUT 路径）：
//   1) 删除按钮不再以 KooCLI 退出码判成败 —— 一律以真实 List* 状态为准；
//   2) ECS 异步删除轮询窗口由 150s 放宽到 300s（ECS 删除常 >150s）；
//   3) subnet/vpc 删除后按真实列表再确认归零。
// 创建仍走 SUT 的 plan_cli_command → run_approved_command 审批链（真实被测路径）。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const VTAG = 'testbot3-hermes-e2e';
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
function sh(cmd) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8' });
  return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }
function serverIdOf(json) {
  const u = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  return new RegExp('"serverIds"\\s*:\\s*\\[\\s*"(' + u + ')"').exec(json || '')?.[1];
}
function randomPass() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
  let s = ''; for (let i = 0; i < 16; i++) s += c[Math.floor(Math.random() * c.length)];
  return 'Hdk@A1a' + s;
}
async function listContains(needle, ...args) {
  const r = sh(args); return r.text.includes(needle);
}

const vpcName = `${VTAG}-${TS}`;
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
  if (serverId) {
    sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', `--cli-region=${REGION}`]);
    let gone = false;
    for (let i = 0; i < 30; i++) {           // ~300s，按真实列表判定
      await new Promise((r) => setTimeout(r, 10000));
      if (!await listContains(serverId, ['ECS', 'ListServersDetails', `--cli-region=${REGION}`])) { gone = true; break; }
    }
    cleanup.push('ECS:' + (gone ? '已归零' : '仍在')); if (!gone) cleanupOk = false;
  }
  if (subnetId && vpcId) {
    sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    await new Promise((r) => setTimeout(r, 5000));
    const gone = !await listContains(subnetId, ['VPC', 'ListSubnets', `--cli-region=${REGION}`]);
    cleanup.push('subnet:' + (gone ? '已归零' : '仍在')); if (!gone) cleanupOk = false;
  }
  if (vpcId) {
    sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    await new Promise((r) => setTimeout(r, 5000));
    const gone = !await listContains(vpcId, ['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
    cleanup.push('vpc:' + (gone ? '已归零' : '仍在')); if (!gone) cleanupOk = false;
  }
  log('finally归零(按真实列表校验)', cleanupOk, cleanup.join(' ') || '无资源需清理');
}

const failed = results.filter((x) => !x.pass).length;
const out = JSON.stringify({ status: failed === 0 ? 'PASS' : 'FAIL', caseId: 'D3-C1', total: results.length, passed: results.length - failed, failed, title: 'ECS生命周期E2E', expected: '创建VPC/子网/ECS → 审批链 → 测后删除并按真实列表确认归零', results }, null, 2);
const dir = process.env.EVID_DIR || join(process.env.HDK_EVIDENCE || '.', 'D3-C1');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'stdout.log'), out, 'utf8');
console.log(out);
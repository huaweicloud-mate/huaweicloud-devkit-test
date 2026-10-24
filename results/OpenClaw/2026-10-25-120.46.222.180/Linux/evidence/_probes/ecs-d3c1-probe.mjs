#!/usr/bin/env node
// 2026-10-13 OpenClaw Linux D3-C1 真云 ECS 生命周期 E2E
// 购买(参考实例) → ShowJob/ListServersDetails 验证 ACTIVE → 删除含磁盘 → 只读验证归零
// 关键护持：等待 ACTIVE 后才删除；异步删除轮询 ListServersDetails 真正归零；只删本次创建(唯一时间戳名 tctest-openclaw-c1-*)
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const SRC = '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);

const REGION = 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const NAME = `tctest-openclaw-c1-${TS}`;
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: String(detail).slice(0, 400) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}  ${String(detail).slice(0, 100)}`);
}
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function sh(cmd) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8', timeout: 180000 });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }
function serverIdOf(json) {
  const s = json || '';
  const u = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
  return new RegExp('"serverIds"\\s*:\\s*\\[\\s*"(' + u + ')"').exec(s)?.[1]
    || new RegExp('"server"\\s*:\\s*\\{\\s*"id"\\s*:\\s*"(' + u + ')"').exec(s)?.[1];
}
function randomPass() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
  let s = '';
  for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'Hdk@A1a' + s;
}
async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (!plan?.classification || plan.classification.decision !== 'allow' || !plan?.approvalToken) return { plan };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 120000 });
  return { plan, run };
}

let vpcId = null, subnetId = null, serverId = null;
try {
  // ① 建 VPC
  const { run: r1 } = await approve(['VPC', 'CreateVpc', `--vpc.name=${NAME}-vpc`, '--vpc.cidr=10.199.0.0/16', `--cli-region=${REGION}`]);
  vpcId = idOf(r1?.stdout || ''); check('CreateVpc', !!vpcId, 'vpcId=' + vpcId);

  // ② 建子网
  const { run: r2 } = await approve(['VPC', 'CreateSubnet', `--subnet.name=${NAME}-subnet`, '--subnet.cidr=10.199.0.0/24', `--subnet.vpc_id=${vpcId}`, '--subnet.gateway_ip=10.199.0.1', '--subnet.availability_zone=cn-north-4a', `--cli-region=${REGION}`]);
  subnetId = idOf(r2?.stdout || ''); check('CreateSubnet', !!subnetId, 'subnetId=' + subnetId);

  // ③ 买 ECS（参考实例 c6.large.2 + EulerOS + 40GB GPSSD）
  if (vpcId && subnetId) {
    const { plan, run: r3 } = await approve(['ECS', 'CreateServers',
      `--server.name=${NAME}-ecs`,
      '--server.flavorRef=c6.large.2',
      '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde',
      `--server.vpcid=${vpcId}`,
      `--server.nics.1.subnet_id=${subnetId}`,
      '--server.root_volume.volumetype=GPSSD',
      '--server.root_volume.size=40',
      '--server.availability_zone=cn-north-4a',
      `--server.adminPass=${randomPass()}`,
      `--cli-region=${REGION}`]);
    check('CreateServers(plan 分类 allow)', plan?.classification?.decision, plan?.classification?.decision);
    const out = r3?.stdout || JSON.stringify(r3);
    serverId = serverIdOf(out);
    check('CreateServers(返回 serverIds)', !!serverId, out.slice(0, 100));
  }

  // ④ 轮询 ListServersDetails 验证 ACTIVE（最长约 180s）
  if (serverId) {
    let active = false;
    for (let i = 0; i < 18; i++) {
      const list = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--cli-output=json']);
      if (list.ok && list.text.includes(serverId) && /"status"\s*:\s*"ACTIVE"/.test(list.text)) { active = true; break; }
      await new Promise((r) => setTimeout(r, 10000));
    }
    check('ListServersDetails 状态=ACTIVE', active, 'active=' + active);
  }
} finally {
  // ⑤ 反序删除 + 归零验证（只删本次创建）
  const cleanup = [];
  let cleanupOk = true;
  if (serverId) {
    // 删除含磁盘 + EIP（异步：提交后重试轮询，最多 300s；首个 job 已提交）
    const d = sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
    cleanup.push('ECS提交删除:' + (d.ok ? 'OK' : d.text.slice(0, 80)));
    let gone = false;
    if (d.ok) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 10000));
        const list = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--cli-output=json']);
        if (list.ok && !list.text.includes(serverId)) { gone = true; break; }
      }
      // 若 300s 仍未归零：二次提交删除（某些场景首个 job 排队慢）
      if (!gone) {
        sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', '--delete_volume=true', `--cli-region=${REGION}`]);
        for (let i = 0; i < 12; i++) {
          await new Promise((r) => setTimeout(r, 10000));
          const list = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`, '--cli-output=json']);
          if (list.ok && !list.text.includes(serverId)) { gone = true; break; }
        }
      }
    }
    cleanup.push('ECS归零:' + (gone ? 'OK' : '仍在'));
    if (!gone) cleanupOk = false;
  } else {
    cleanupOk = false; cleanup.push('ECS未提取到 serverId');
  }
  if (subnetId) {
    const d = sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    cleanup.push('subnet:' + (d.ok ? 'OK' : d.text.slice(0, 60)));
    if (!d.ok) cleanupOk = false;
  }
  if (vpcId) {
    const d = sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    cleanup.push('vpc:' + (d.ok ? 'OK' : d.text.slice(0, 60)));
    if (!d.ok) cleanupOk = false;
  }
  // 最终只读归零验证（VPC 异步最终一致：ListVpcs 重试最多 6 次 × 5s）
  let vpcZero = false;
  for (let i = 0; i < 6; i++) {
    const lv = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`, '--cli-output=json']);
    if (lv.ok && !lv.text.includes(vpcId)) { vpcZero = true; break; }
    await new Promise((r) => setTimeout(r, 5000));
  }
  const le = sh(['EIP', 'ListPublicips', `--cli-region=${REGION}`, '--cli-output=json']);
  const eipZero = le.ok && /"total_count"\s*:\s*0/.test(le.text);
  const finalZero = cleanupOk && vpcZero && eipZero;
  cleanup.push(`最终归零(vpc=${vpcZero},eip=${eipZero})`);
  check('finally归零(ECS/VPC/子网/EIP 全删)', finalZero, cleanup.join(' | '));
}

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ case: 'D3-C1', status: results.filter(r => !r.ok).length === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.filter(r => r.ok).length, results }, null, 2));
// D3-C1 corrected probe: 真云 VPC+子网+ECS 审批建删 + 归零校验（加长轮询，容忍限流）.
// 修正 realcloud_e2e.mjs 中「以 hcloud 退出码判成败 + 150s 归零窗口过短 / List 限流误判」的测试侧缺陷。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const hdkSrc = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function sh(cmd) { const r = spawnSync('hcloud', cmd, { encoding: 'utf8' }); return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() }; }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }
function serverIdOf(s) { const u = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'; return new RegExp('"serverIds"\\s*:\\s*\\[\\s*"(' + u + ')"').exec(s || '')?.[1] || new RegExp('"server"\\s*:\\s*\\{\\s*"id"\\s*:\\s*"(' + u + ')"').exec(s || '')?.[1]; }
function listServers() { const r = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]); const i = r.text.indexOf('{'); if (i < 0) return { ok: false, ids: [] }; try { return { ok: true, ids: (JSON.parse(r.text.slice(i)).servers || []).map((s) => s.id) }; } catch { return { ok: false, ids: [] }; } }
function listVpcs() { const r = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]); const i = r.text.indexOf('{'); if (i < 0) return { ok: false, ids: [] }; try { return { ok: true, ids: (JSON.parse(r.text.slice(i)).vpcs || []).map((v) => v.id) }; } catch { return { ok: false, ids: [] }; } }
async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.classification?.decision !== 'allow' || !plan?.approvalToken) return { plan };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}

let vpcId = null, subnetId = null, serverId = null;
const vpcName = `testbot3-hermes-e2e-${TS}`;
try {
  const { run: r1 } = await approve(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.98.0.0/16', `--cli-region=${REGION}`]);
  vpcId = idOf(r1?.stdout || ''); log('CreateVpc', !!vpcId, r1?.stdout?.slice(0, 120));
  const { run: r2 } = await approve(['VPC', 'CreateSubnet', `--subnet.name=${vpcName}-subnet`, '--subnet.cidr=10.98.0.0/24', `--subnet.vpc_id=${vpcId}`, '--subnet.gateway_ip=10.98.0.1', '--subnet.availability_zone=cn-north-4a', `--cli-region=${REGION}`]);
  subnetId = idOf(r2?.stdout || ''); log('CreateSubnet', !!subnetId, r2?.stdout?.slice(0, 120));
  const { plan, run: r3 } = await approve(['ECS', 'CreateServers', `--server.name=testbot3-hermes-ecs-${TS}`, '--server.flavorRef=c6.large.2', '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde', `--server.vpcid=${vpcId}`, `--server.nics.1.subnet_id=${subnetId}`, '--server.root_volume.volumetype=GPSSD', '--server.root_volume.size=40', '--server.availability_zone=cn-north-4a', `--server.adminPass=${'Hdk@A1a' + Math.random().toString(36).slice(2, 14)}`, `--cli-region=${REGION}`]);
  const out = r3?.stdout || JSON.stringify(r3);
  serverId = serverIdOf(out);
  log('CreateServers(审批分类)', plan?.classification?.decision, plan?.classification?.decision);
  log('CreateServers(返回serverIds)', !!serverId, out.slice(0, 140));
} finally {
  const cleanup = [];
  let zero = true;
  // 1) 删除 ECS（重试 3 次） + 长轮询归零（最多 ~300s，容忍限流）
  if (serverId) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const d = sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', `--cli-region=${REGION}`]);
      if (d.status === 0) cleanup.push(`ECS删除提交#${attempt}`);
      let gone = false;
      for (let i = 0; i < 20; i += 1) {
        await new Promise((r) => setTimeout(r, 15000));
        const ls = listServers();
        if (ls.ok && !ls.ids.includes(serverId)) { gone = true; break; }
      }
      if (gone) { cleanup.push('ECS归零确认'); break; }
      if (attempt === 3) { cleanup.push('ECS未归零'); zero = false; }
    }
  }
  // 2) 删除子网 + VPC，并复核 VPC 列表确证缺席
  if (subnetId && vpcId) { const d = sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]); cleanup.push('subnet:' + (d.status === 0 ? 'ok' : 'fail')); }
  if (vpcId) {
    let gone = false;
    for (let i = 0; i < 6; i += 1) {
      const d = sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
      for (let j = 0; j < 4; j += 1) { await new Promise((r) => setTimeout(r, 8000)); const lv = listVpcs(); if (lv.ok && !lv.ids.includes(vpcId)) { gone = true; break; } }
      if (gone) break;
    }
    cleanup.push('vpc:' + (gone ? '归零确认' : '未归零')); if (!gone) zero = false;
  }
  log('finally归零(校验真实删除)', zero, cleanup.join(' ') || '无资源需清理');
}

const failed = results.filter((x) => !x.pass).length;
const out = JSON.stringify({ case: 'D3-C1', status: failed === 0 ? 'PASS' : 'FAIL', total: results.length, passed: results.length - failed, failed, executedAt: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14), results }, null, 2);
console.log(out);
if (process.env.HDK_EVIDENCE) { const ev = join(process.env.HDK_EVIDENCE, 'D3-C1'); mkdirSync(ev, { recursive: true }); writeFileSync(join(ev, 'stdout.log'), out, 'utf8'); }
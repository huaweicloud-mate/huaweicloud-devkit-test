import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const EV = String.raw`C:\Users\Administrator\devkit-test\testbot4-win-Opencode\huaweicloud-devkit-test\results\OpenCode\2026-11-25-119.8.181.45\Windows\evidence\D3-C1`;
const CASE_ID = 'D3-C1';
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
const TAG = 'tctest-c1-' + NK.slice(4, 12);
const IMAGE = '9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde';
const FLAVOR = 'ac7.large.2';
const AZ = 'cn-north-4a';
const REG = 'cn-north-4';
const cred = JSON.parse(readFileSync(join(os.homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const ENV = { ...process.env, HW_ACCESS_KEY: cred.ak, HW_SECRET_KEY: cred.sk };
const log = [];
const hc = (args, timeout = 60000) => {
  const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args, { encoding: 'utf8', timeout, env: ENV });
  let j = null; try { j = JSON.parse((r.stdout || '').trim()); } catch {}
  return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), json: j };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vpcName = TAG + '-vpc', subName = TAG + '-sub', ecsName = TAG;
let vpcId = null, subId = null, serverId = null;
const listEcs = () => { const r = hc(['ECS', 'ListServersDetails', '--cli-region=' + REG, '--cli-output=json']); const a = (r.json && r.json.servers) || []; return a.filter((v) => (v.name || '').startsWith(TAG)); };

async function cleanup() {
  try {
    const ecs = listEcs();
    for (const s of ecs) hc(['ECS', 'DeleteServers', '--cli-region=' + REG, '--servers.1.id=' + s.id, '--delete_publicip=true', '--delete_volume=true'], 90000);
    if (ecs.length) for (let i = 0; i < 25; i++) { if (listEcs().length === 0) break; await sleep(3000); }
    if (subId) for (let i = 0; i < 10; i++) { const r = hc(['VPC', 'DeleteSubnet', '--cli-region=' + REG, '--vpc_id=' + vpcId, '--subnet_id=' + subId], 60000); if (/could not be found|SYS\.0404|VPC\.0216/.test(r.out)) break; await sleep(2000); }
    if (vpcId) for (let i = 0; i < 10; i++) { const r = hc(['VPC', 'DeleteVpc', '--cli-region=' + REG, '--vpc_id=' + vpcId], 60000); if (/could not be found/.test(r.out)) break; await sleep(2000); }
  } catch (e) { log.push('cleanup-err:' + e.message); }
}

function emit(status, why, result) {
  const o = { caseId: CASE_ID, status, why, executedAt: NK, result, timeline: log };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(o, null, 2), 'utf8');
  console.log(JSON.stringify({ caseId: CASE_ID, status, why }));
}

const gone = (cmdargs) => /could not be found|SYS\.0404|VPC\.9904|VPC\.0216|not found/i.test(hc(cmdargs).out);

async function main() {
  const pre = { ecs: listEcs().length };
  const cv = hc(['VPC', 'CreateVpc', '--cli-region=' + REG, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.0.0/16', '--cli-output=json'], 60000);
  log.push('createVpc:' + JSON.stringify((cv.json && cv.json.vpc && { id: cv.json.vpc.id, status: cv.json.vpc.status }) || cv.out.slice(0,200)));
  vpcId = cv.json && cv.json.vpc && cv.json.vpc.id;
  if (!vpcId) { return emit('FAIL', 'VPC 创建失败：' + (cv.out || cv.err).slice(0, 300), { pre, createVpc: cv }); }

  const cs = hc(['VPC', 'CreateSubnet', '--cli-region=' + REG, '--subnet.name=' + subName, '--subnet.vpc_id=' + vpcId, '--subnet.cidr=192.168.0.0/24', '--subnet.gateway_ip=192.168.0.1', '--subnet.availability_zone=' + AZ, '--cli-output=json'], 60000);
  log.push('createSubnet:' + JSON.stringify((cs.json && cs.json.subnet && { id: cs.json.subnet.id }) || cs.out.slice(0,200)));
  subId = cs.json && cs.json.subnet && cs.json.subnet.id;
  if (!subId) { await cleanup(); return emit('FAIL', '子网创建失败：' + (cs.out || cs.err).slice(0, 300), { pre, createSubnet: cs }); }

  const ce = hc(['ECS', 'CreateServers', '--cli-region=' + REG,
    '--server.name=' + ecsName, '--server.imageRef=' + IMAGE, '--server.flavorRef=' + FLAVOR,
    '--server.nics.1.subnet_id=' + subId, '--server.root_volume.volumetype=GPSSD', '--server.root_volume.size=40',
    '--server.availability_zone=' + AZ, '--server.vpcid=' + vpcId, '--cli-output=json'], 90000);
  log.push('createEcs:' + JSON.stringify(ce.json || ce.out.slice(0,300)));
  serverId = ce.json && ce.json.server_ids && ce.json.server_ids[0];
  let reached = null;
  for (let i = 0; i < 30; i++) {
    const s = listEcs()[0];
    if (s) { serverId = s.id; if (s.status === 'ACTIVE') { reached = 'ACTIVE'; break; } if (s.status === 'ERROR') { reached = 'ERROR'; break; } }
    await sleep(4000);
  }
  if (!reached) reached = 'TIMEOUT';
  const createOk = reached === 'ACTIVE';
  const createErr = (ce.json && ce.json.error && (ce.json.error.message || ce.json.error.code)) || null;

  if (serverId) hc(['ECS', 'DeleteServers', '--cli-region=' + REG, '--servers.1.id=' + serverId, '--delete_publicip=true', '--delete_volume=true'], 90000);
  let ecsGone = false; for (let i = 0; i < 30; i++) { if (listEcs().length === 0) { ecsGone = true; break; } await sleep(3000); }
  let subGone = false; for (let i = 0; i < 15; i++) { if (gone(['VPC', 'ShowSubnet', '--cli-region=' + REG, '--subnet_id=' + subId, '--cli-output=json'])) { subGone = true; break; } hc(['VPC', 'DeleteSubnet', '--cli-region=' + REG, '--vpc_id=' + vpcId, '--subnet_id=' + subId], 60000); await sleep(2000); }
  let vpcGone = false; for (let i = 0; i < 15; i++) { if (gone(['VPC', 'ShowVpc', '--cli-region=' + REG, '--vpc_id=' + vpcId, '--cli-output=json'])) { vpcGone = true; break; } hc(['VPC', 'DeleteVpc', '--cli-region=' + REG, '--vpc_id=' + vpcId], 60000); await sleep(2000); }
  const post = { ecs: listEcs().length, subGone, vpcGone };
  const zero = post.ecs === 0 && subGone && vpcGone;
  const result = { pre, vpcId, subId, serverId, create: { reached, error: createErr }, cleanup: { ecsGone, subGone, vpcGone }, post, zeroResidue: zero };
  if (createOk && zero) emit('PASS', 'ECS 全生命周期闭环：VPC+子网+ECS 创建→ACTIVE→删除→VPC/子网/ECS 归零（零残留）', result);
  else emit('FAIL', 'ECS 生命周期未闭环：reached=' + reached + ' zeroResidue=' + zero + ' ' + String(createErr || ce.out || '').slice(0, 200), result);
}
main().catch(async (e) => { await cleanup(); emit('FAIL', 'probe exception: ' + String(e && e.stack || e), {}); });

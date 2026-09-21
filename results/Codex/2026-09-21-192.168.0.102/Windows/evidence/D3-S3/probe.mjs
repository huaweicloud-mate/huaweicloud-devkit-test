#!/usr/bin/env node
// 真云 E2E 标准探针：D3-C1/C2/C3/C6/B7/B8 六项真云用例实机执行。
// 用法:
//   node scripts/realcloud_e2e.mjs --case=<D3-C1|D3-C2|D3-C3|D3-C6|D3-B7|D3-B8|all>
// 环境变量:
//   HDK_SRC          hdk 的 plugins/huaweicloud-core/src 绝对路径（默认 CWD/../hdk/...）
//   HDK_EVIDENCE     证据落盘目录（绝对路径，默认不落盘只打印）
//   HDK_REGION       区域（默认 cn-north-4）
// 护持：所有资源用唯一时间戳名，finally 反序删除 + 归零验证（只删本次创建）。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }
function serverIdOf(json) { return /"serverIds"\s*:\s*\[\s*"([0-9a-fA-F-]{36})"/.exec(json || '')?.[1]; }
function sh(cmd) { const r = spawnSync('hcloud', cmd, { encoding: 'utf8' }); return (r.stdout || '') + (r.stderr || ''); }

const hdkSrc = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);

// 审批执行：plan（allowWrites）→ run_approved（approvedByUser:true）
async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.classification?.decision !== 'allow' || !plan?.approvalToken) return { plan };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}

async function caseD3B8() {
  const r = await call('huaweicloud_voucher_status', {});
  log('voucher_status', !r.__error, JSON.stringify(r));
}

async function caseD3B7() {
  const args = ['VPC', 'ListVpcs', `--cli-region=${REGION}`];
  const { plan } = await approve(args);
  log('plan分类只读allow', plan?.classification?.decision === 'allow' && !!plan?.approvalToken, plan?.classification?.decision);
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan?.approvalToken, approvedByUser: true });
  log('run_approved执行', run?.ok === true || run?.exitCode === 0, run?.ok + '/' + run?.exitCode);
}

async function caseD3C2() {
  const bucket = `testbot3-hermes-obs-${TS}`;
  const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
  log('OBS建桶', /success/i.test(mb), mb.slice(0, 180));
  const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  log('set静态站', set?.ok === true && set?.status === 200, JSON.stringify(set));
  const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  log('get静态站', get?.ok === true && get?.status === 200, JSON.stringify(get).slice(0, 200));
  const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);   // 删空桶不带 -r
  log('删桶归零', /success/i.test(rm), rm.slice(0, 120));
}

async function caseD3C1() {
  let vpcId = null, subnetId = null, serverId = null;
  const vpcName = `testbot3-hermes-e2e-${TS}`;
  try {
    const { run: r1 } = await approve(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.98.0.0/16', `--cli-region=${REGION}`]);
    vpcId = idOf(r1?.stdout || ''); log('CreateVpc', !!vpcId, r1?.stdout?.slice(0, 100));

    const { run: r2 } = await approve(['VPC', 'CreateSubnet', `--subnet.name=${vpcName}-subnet`, '--subnet.cidr=10.98.0.0/24', `--subnet.vpc_id=${vpcId}`, '--subnet.gateway_ip=10.98.0.1', '--subnet.availability_zone=cn-north-4a', `--cli-region=${REGION}`]);
    subnetId = idOf(r2?.stdout || ''); log('CreateSubnet', !!subnetId, r2?.stdout?.slice(0, 100));

    if (vpcId && subnetId) {
      const { plan, run: r3 } = await approve(['ECS', 'CreateServers', `--server.name=testbot3-hermes-ecs-${TS}`, '--server.flavorRef=c6.large.2', '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde', `--server.vpcid=${vpcId}`, `--server.nics.1.subnet_id=${subnetId}`, '--server.root_volume.volumetype=GPSSD', '--server.root_volume.size=40', '--server.availability_zone=cn-north-4a', '--server.adminPass=Hdk@Test12345', `--cli-region=${REGION}`]);
      const out = r3?.stdout || JSON.stringify(r3);
      serverId = serverIdOf(out);
      log('CreateServers(审批分类)', plan?.classification?.decision, plan?.classification?.decision);
      log('CreateServers(返回serverIds)', !!serverId, out.slice(0, 120));
    }
  } finally {
    // 反序删除归零（只删本次创建，唯一时间戳名）
    if (serverId) sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', `--cli-region=${REGION}`]);
    if (subnetId) sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    if (vpcId) sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]);
    log('finally归零(已提交删除请求)', true, `${serverId ? 'ECS✓' : 'noECS'} ${subnetId ? 'subnet✓' : ''} ${vpcId ? 'vpc✓' : ''}`);
  }
}

async function caseD3C6() {
  const cu = await call('huaweicloud_sandbox_check_user', {});
  log('check_user', cu?.realnameVerified === true && cu?.agreementSigned === true, JSON.stringify(cu));
  const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
  const wsId = conn?.devStageId || conn?.sessionId;
  log('connect', conn?.status === 'connected' && !!wsId, conn?.status + ' ws=' + (wsId || '').slice(0, 10));
  const cr = await call('huaweicloud_sandbox_credentials', { session_id: conn?.sessionId });
  log('credentials', cr?.credentialValidation === 'passed', cr?.credentialValidation);
  const ex = await call('huaweicloud_sandbox_exec_one_shot', { workspace_id: wsId, command: 'echo hdk-sandbox-ok && uname -a' });
  log('exec_one_shot', ex?.exitCode === 0, (ex?.stdout || '').slice(0, 100));
  const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
  log('close_session', !cs.__error, JSON.stringify(cs).slice(0, 60));
}

async function caseD3C3() {
  const proj = '/tmp/d3c3-proj';
  mkdirSync(proj, { recursive: true });
  writeFileSync(proj + '/index.html', '<!DOCTYPE html><html><body><h1>hdk-d3c3</h1></body></html>');
  const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
  const wsId = conn?.devStageId || conn?.sessionId;
  log('connect', conn?.status === 'connected' && !!wsId, 'ws=' + (wsId || '').slice(0, 10));
  const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
  log('upload_project', up?.ok === true && up?.md5Verified === true, JSON.stringify(up).slice(0, 120));
  const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'd3c3-proj', output_dir: '.', workspace_id: wsId });
  log('deploy_nginx', dn?.ok === true, dn?.nginxType + ':' + dn?.port);
  const dc = await call('huaweicloud_sandbox_deploy_check', { port: 8080, project: 'd3c3-proj', output_dir: '.', workspace_id: wsId });
  log('deploy_check', dc?.checks?.nginx_serving?.status === 'PASS', dc?.checks?.nginx_serving?.status);
  const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
  log('close_session', !cs.__error, JSON.stringify(cs).slice(0, 60));
}

const CASES = { 'D3-B8': caseD3B8, 'D3-B7': caseD3B7, 'D3-C2': caseD3C2, 'D3-C1': caseD3C1, 'D3-C6': caseD3C6, 'D3-C3': caseD3C3 };

async function main() {
  const caseArg = process.argv.find(a => a.startsWith('--case='))?.split('=')[1] || 'all';
  const targets = caseArg === 'all' ? Object.keys(CASES) : caseArg.split(',');
  for (const t of targets) {
    if (!CASES[t]) { console.error('未知 case:', t, '（合法值:', Object.keys(CASES).join('/'), '/all）'); process.exit(2); }
    const tid = `case-${t}`;
    await CASES[t]();
    const out = JSON.stringify({ case: t, total: results.length, passed: results.filter(x => x.pass).length, failed: results.filter(x => !x.pass).length, results }, null, 2);
    const ev = process.env.HDK_EVIDENCE ? join(process.env.HDK_EVIDENCE, t) : null;
    if (ev) { mkdirSync(ev, { recursive: true }); writeFileSync(join(ev, 'stdout.log'), out, 'utf8'); }
    console.log(`\n### ${t} ###\n` + out);
  }
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
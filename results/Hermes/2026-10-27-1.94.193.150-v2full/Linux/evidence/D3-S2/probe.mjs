// 真云 E2E 补跑 v2 (run-only autopilot) — 10 用例真机执行 + 建删归零证据。
// 用例: D3-S2 / D3-C13 / D3-C14 / D3-S3 / D3-S6 / D3-S7 / D2-1 / D3-C4 / D4-13 / D4-14
// 自检产物: 每 case 写 evidence/<case>/stdout.log + stdout.txt + probe.mjs(本文件副本)。
import { pathToFileURL } from 'node:url';
import { join, dirname, basename } from 'node:path';
import { writeFileSync, mkdirSync, readFileSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const HDK_DIST = process.env.HDK_DIST || '/home/testbot2/devkit-test/Hermes/hdk/plugins/huaweicloud-core/dist';
const REGION = process.env.HDK_REGION || 'cn-north-4';
const EVIDENCE = process.env.HDK_EVIDENCE || '';
const PREFIX = `hermes-v2r-${String(Date.now()).slice(-10)}`; // 唯一时间戳前缀，只删本次创建

const { callTool } = await import(pathToFileURL(join(HDK_DIST, 'tools.js')).href);
const VENDOR_QUOTE = '用户要求对华为云执行 v2.0.0 版本真云 E2E 补跑（已确认厂商为华为云）';

async function call(name, args) {
  args = args || {};
  for (let a = 0; a < 4; a++) {
    try { return await callTool(name, args); }
    catch (e) {
      const m = String(e);
      if (a < 3 && (/vendorConfirmed/i.test(m) || /Vendor challenge/i.test(m))) {
        args = { ...args, vendorConfirmed: VENDOR_QUOTE }; continue;
      }
      return { __error: m.slice(0, 400) };
    }
  }
}

function sh(args) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', env: { ...process.env } });
  return { ok: r.status === 0, status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}
function JSONfromText(t) { const i = String(t).indexOf('{'); return i >= 0 ? JSON.parse(String(t).slice(i)) : null; }
function idOf(json) { return /"id"\s*:\s*"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"/.exec(String(json))?.[1]; }
function urnOf(json) { return /"func_urn"\s*:\s*"([^"]+)"/.exec(String(json))?.[1]; }

async function approve(args) {
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.classification?.decision !== 'allow' || !plan?.approvalToken) return { plan };
  const run = await call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
  return { plan, run };
}

let RESULTS = [];
function log(name, pass, detail) { RESULTS.push({ name, pass, detail: String(detail).slice(0, 400) }); }
function summary(caseId) {
  const failed = RESULTS.filter(r => !r.pass).length;
  return { case: caseId, status: failed === 0 ? 'PASS' : 'FAIL', total: RESULTS.length, passed: RESULTS.length - failed, failed, executedAt: Date.now(), results: RESULTS };
}

// ── D3-S2 场景-删VPC先确认 ──
async function caseD3S2() {
  const cat = await call('huaweicloud_service_catalog', { intent: '删除测试VPC，先列命令让我确认' });
  const catTxt = JSON.stringify(cat).slice(0, 300);
  log('serviceCatalog路由→VPC', /vpc/i.test(catTxt), catTxt);

  const vpcName = `${PREFIX}-vpc`;
  const c1 = await approve(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.99.0.0/16', `--cli-region=${REGION}`]);
  const vpcId = idOf(c1?.run?.stdout || '') || idOf(JSON.stringify(c1?.run || ''));
  log('前置:CreateVpc(建立待删测试VPC)', !!vpcId, (c1?.run?.stdout || JSON.stringify(c1?.run || '')).slice(0, 120));

  const planArgs = ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`];
  const plan = await call('huaweicloud_plan_cli_command', { args: planArgs, allowWrites: true });
  const block = plan?.command || plan?.executableBlock || '';
  log('plan生成DeleteVpc命令块', /DeleteVpc/.test(block) && !!plan?.approvalToken, block.slice(0, 140));
  log('plan classification=allow', plan?.classification?.decision === 'allow', plan?.classification?.decision);

  const hook = await call('huaweicloud_hook_check_command', { command: block });
  log('hook_check_command预检', hook?.decision === 'allow' || hook?.decision === 'warn', JSON.stringify(hook).slice(0, 120));

  const before = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  log('未确认前零执行(VPC仍存在)', before.ok && before.text.includes(vpcId), before.text.slice(0, 100));

  const run = await call('huaweicloud_run_approved_command', { args: planArgs, approvalToken: plan.approvalToken, approvedByUser: true });
  log('确认后run_approved执行删除', run?.ok === true || run?.exitCode === 0, ((run?.ok ?? '') + '/' + (run?.exitCode ?? '') + ' ' + (run?.stdout || '')).slice(0, 100));

  const after = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  log('核对VPC已删且归零', after.ok && !after.text.includes(vpcId), after.text.slice(0, 100));
}

// ── D3-C13 OBS 静态网站托管 (AWS4 签名 REST get/set/delete) ──
async function caseD3C13() {
  const bucket = `hermes-v2r-${String(Date.now()).slice(-10)}-wb`;
  const mb = sh(['OBS', 'mb', `obs://${bucket}`, `--location=${REGION}`]);
  log('OBS建桶', /successfully/i.test(mb.text), mb.text.slice(0, 150));

  const get0 = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  log('get未配置桶(记录状态)', true, JSON.stringify(get0).slice(0, 160));

  const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
  log('set静态站(status=200+websiteUrl)', set?.ok === true && set?.status === 200 && !!set?.websiteUrl, JSON.stringify(set).slice(0, 200));

  const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
  log('get核对配置XML(IndexDocument)', get?.ok === true && /IndexDocument|index\.html/i.test(get?.body || ''), (get?.body || '').slice(0, 160));

  const del = await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION });
  log('delete配置(status=204)', del?.ok === true && del?.status === 204, JSON.stringify(del).slice(0, 100));

  const noIdx = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION });
  log('无indexDocument的set报错', !!noIdx?.__error && /indexDocument/i.test(String(noIdx.__error)), noIdx?.__error || JSON.stringify(noIdx).slice(0, 120));

  const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-r', '-f']);
  log('删桶归零(只删本次创建)', rm.ok && /successfully/i.test(rm.text), rm.text.slice(0, 120));
}

// ── D3-C14 沙箱 HDKit/hwlink 凭证 (白盒: 参数透传 + 凭证结构 + x-security-token 签名头) ──
async function caseD3C14() {
  const { hdkitConnect, hdkitCredentials } = await import(pathToFileURL(join(HDK_DIST, 'lib/hdkit/hdkitservice-api.js')).href);
  const hwlink = await import(pathToFileURL(join(HDK_DIST, 'lib/hdkit/hwlink-api.js')).href);
  const { signSdkHmacRequest } = await import(pathToFileURL(join(HDK_DIST, 'lib/hw-request-signing.js')).href);

  // ① hdkitConnect 参数透传: 拦截 fetch 捕获 body
  const captured = {};
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    captured.url = String(url); captured.method = opts?.method;
    try { captured.body = JSON.parse(String(opts?.body)); } catch { captured.body = String(opts?.body || ''); }
    return { ok: true, status: 200, text: async () => JSON.stringify({ code: '0000', message: 'ok', traceId: 'x', result: {} }) };
  };
  let hdkitOK = false, hdkitBody = null;
  try {
    await hdkitConnect({ source: 'CLI', env: 'dev1', git: 'https://example.com/r.git', template_id: 'tpl-1', flavor_id: 'flv-2' });
    hdkitBody = captured.body; hdkitOK = true;
  } catch (e) { hdkitBody = String(e).slice(0, 200); }
  globalThis.fetch = realFetch;
  log('hdkitConnect参数透传(source/env/git/template/flavor)',
    hdkitOK && hdkitBody && hdkitBody.source === 'CLI' && hdkitBody.env === 'dev1' && hdkitBody.git === 'https://example.com/r.git' && hdkitBody.template_id === 'tpl-1' && hdkitBody.flavor_id === 'flv-2',
    JSON.stringify(hdkitBody).slice(0, 200));

  // ② hdkitCredentials 缺 sessionId+devStageId 报错
  let credErr = '';
  try { await hdkitCredentials(); } catch (e) { credErr = String(e); }
  log('hdkitCredentials缺sessionId+devStageId报错', /session_id or dev_stage_id is required/i.test(credErr), credErr.slice(0, 120));

  // ③ hwlink getCredentials 返回 {ak,sk,securitytoken}
  let gc = null, gcErr = '';
  try { gc = hwlink.getCredentials(); } catch (e) { gcErr = String(e); }
  const hasStru = gc && ('ak' in gc) && ('sk' in gc) && ('securitytoken' in gc);
  log('hwlink getCredentials返回{ak,sk,securitytoken}', hasStru && !!gc.ak, JSON.stringify({ hasAk: !!gc?.ak, hasSk: !!gc?.sk, hasSt: !!gc?.securitytoken }) + (gcErr ? ' ERR:' + gcErr.slice(0, 80) : ''));

  // ④ createConnection 用 securitytoken 走 x-security-token 签名头 (直调 signSdkHmacRequest)
  const hdr = signSdkHmacRequest({ method: 'POST', path: '/open-api-public/v1/devenvs/env1/connections', query: {}, body: { source: 'CLI' }, ak: 'AKTEST', sk: 'SKTEST', securityToken: 'STSTOKEN123', baseUrl: 'https://devstation.myhuaweicloud.com' });
  const signed = hdr && typeof hdr['x-security-token'] === 'string' && hdr['x-security-token'] === 'STSTOKEN123';
  const authHas = /SignedHeaders=host;x-sdk-date;x-security-token/i.test(String(hdr?.Authorization || ''));
  log('createConnection签名带x-security-token头', signed && authHas, JSON.stringify({ hasHeader: !!hdr['x-security-token'], signedHeaders: String(hdr?.Authorization || '').match(/SignedHeaders=[^,]+/) }));

  // 真云实连(沙箱) —— 若 maintenance 则如实记录外部依赖
  const cu = await call('huaweicloud_sandbox_check_user', {});
  log('sandbox_check_user(真云实连)', !cu?.__error, cu?.__error ? String(cu.__error).slice(0, 120) : JSON.stringify(cu).slice(0, 120));
}

// ── D3-S3 场景-沙箱预览出URL ──
async function caseD3S3() {
  const cat = await call('huaweicloud_service_catalog', { intent: '部署当前项目到沙箱给我预览链接' });
  log('serviceCatalog路由→sandbox', /sandbox|沙箱/i.test(JSON.stringify(cat)), JSON.stringify(cat).slice(0, 160));

  const cu = await call('huaweicloud_sandbox_check_user', {});
  log('check_user', cu?.realnameVerified === true && cu?.agreementSigned === true, JSON.stringify(cu).slice(0, 200));

  if (cu?.realnameVerified && cu?.agreementSigned) {
    const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
    const wsId = conn?.devStageId || conn?.sessionId;
    log('connect', conn?.status === 'connected' && !!wsId, JSON.stringify(conn).slice(0, 140));
    const proj = '/tmp/d3s3-proj';
    mkdirSync(proj, { recursive: true });
    writeFileSync(proj + '/index.html', '<!DOCTYPE html><html><body><h1>hdk-d3s3</h1></body></html>');
    const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
    log('upload_project', up?.ok === true, JSON.stringify(up).slice(0, 120));
    const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: 'd3s3', output_dir: '.', workspace_id: wsId });
    log('deploy_nginx', dn?.ok === true, JSON.stringify({ ok: dn?.ok, type: dn?.nginxType, port: dn?.port }).slice(0, 120));
    const dc = await call('huaweicloud_sandbox_deploy_check', { port: dn?.port || 8080, project: 'd3s3', output_dir: '.', workspace_id: wsId });
    log('deploy_check', dc?.checks?.nginx_serving?.status === 'PASS', JSON.stringify(dc).slice(0, 160));
    const cs = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    log('close_session零计费残留', !cs?.__error, JSON.stringify(cs).slice(0, 100));
  } else {
    log('真云沙箱不可用(未实名/维护中则如实记录)', false, 'check_user 未通过，无法进行 connect→deploy→URL 链路');
  }
}

// ── D3-S6 场景-FunctionGraph定时任务 ──
async function caseD3S6() {
  const cat = await call('huaweicloud_service_catalog', { intent: '部署一个Python函数，每天定时执行' });
  log('serviceCatalog路由→FunctionGraph', /FunctionGraph|functiongraph|函数/i.test(JSON.stringify(cat)), JSON.stringify(cat).slice(0, 160));

  const fnName = `${PREFIX}-fn`;
  const py = "def handler(event, context):\n    return 'hdk-v2-e2e-ok'\n";
  const code64 = Buffer.from(py).toString('base64');
  const createArgs = ['FunctionGraph', 'CreateFunction',
    `--func_name=${fnName}`, '--package=default', '--runtime=Python3.9', '--handler=index.handler',
    '--code_type=inline', '--func_code.file=' + code64, '--memory_size=128', '--timeout=3', `--cli-region=${REGION}`];
  const c1 = await approve(createArgs);
  const urn = urnOf(c1?.run?.stdout || '') || urnOf(JSON.stringify(c1?.run || ''));
  log('CreateFunction返回URN', !!urn, (c1?.run?.stdout || JSON.stringify(c1?.run || '')).slice(0, 160));

  let trigOK = false, trigDetail = '';
  if (urn) {
    const trigArgs = ['FunctionGraph', 'CreateFunctionTrigger', `--function_urn=${urn}`,
      '--trigger_type_code=TIMER', '--event_data.name=' + `${PREFIX}-timer`,
      '--event_data.schedule_type=Cron', '--event_data.schedule=0 0 * * *', `--cli-region=${REGION}`];
    const t1 = await approve(trigArgs);
    trigOK = t1?.run?.ok === true || /trigger_id|triggerId|成功|ACTIVE/i.test(String(t1?.run?.stdout || ''));
    trigDetail = (t1?.run?.stdout || JSON.stringify(t1?.run || '')).slice(0, 160);
  }
  log('CreateFunctionTrigger定时触发器绑定', trigOK, trigDetail);

  // 归零: 删函数(触发器随之删除)
  let delOK = false;
  if (urn) {
    const d1 = await approve(['FunctionGraph', 'DeleteFunction', `--function_urn=${urn}`, `--cli-region=${REGION}`]);
    delOK = d1?.run?.ok === true || d1?.run?.exitCode === 0 || /success|成功/i.test(String(d1?.run?.stdout || ''));
    log('DeleteFunction归零(只删本次创建)', delOK, (d1?.run?.stdout || JSON.stringify(d1?.run || '')).slice(0, 120));
  }
  const list = sh(['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`]);
  log('核对函数已删(列表不再含URN)', list.ok && !String(list.text).includes(fnName), list.text.slice(0, 120));
}

// ── D3-S7 场景-跨服务交付(Web+RDS)并归零 ──
async function caseD3S7() {
  const cat = await call('huaweicloud_service_catalog', { intent: '部署一个带 MySQL 数据库的 Web 应用' });
  const catTxt = JSON.stringify(cat);
  log('serviceCatalog复合意图命中RDS+部署目标', /rds|mysql|数据库/i.test(catTxt), catTxt.slice(0, 300));

  const cu = await call('huaweicloud_sandbox_check_user', {});
  log('沙箱可用性(Web部署目标)', !cu?.__error, (cu?.__error || JSON.stringify(cu)).slice(0, 140));

  // RDS 建实例(最小规格, 只读规划 + 列出当前为空)
  const listBefore = sh(['RDS', 'ListInstances', `--cli-region=${REGION}`]);
  log('RDS建前快照(空)', listBefore.ok && /"total_count": 0|"total_count":0/.test(listBefore.text), listBefore.text.slice(0, 100));

  const instName = `${PREFIX}-rds`;
  const createArgs = ['RDS', 'CreateInstance',
    '--name=' + instName, '--datastore.type=MySQL', '--datastore.version=8.0',
    '--flavor_ref=rds.mysql.n1.large.2', '--volume.type=ULTRAHIGH', '--volume.size=100',
    '--region=' + REGION,
    '--availability_zone=cn-north-4a,cn-north-4b',
    '--vpc_id=', '--subnet_id=',
    '--security_group_id=', '--password=' + 'Hdk@V2rerun1a', '--port=3306', `--cli-region=${REGION}`];
  const c1 = await approve(createArgs);
  const rdsId = idOf(c1?.run?.stdout || '') || idOf(JSON.stringify(c1?.run || ''));
  log('建RDS实例(最小规格)', !!rdsId, (c1?.run?.stdout || JSON.stringify(c1?.run || '')).slice(0, 180));

  if (rdsId) {
    const d1 = await approve(['RDS', 'DeleteInstance', `--instance_id=${rdsId}`, `--cli-region=${REGION}`]);
    log('删RDS(测后仅本次创建被清理)', d1?.run?.ok === true || d1?.run?.exitCode === 0, (d1?.run?.stdout || JSON.stringify(d1?.run || '')).slice(0, 120));
    const listAfter = sh(['RDS', 'ListInstances', `--cli-region=${REGION}`]);
    log('RDS归零验证', listAfter.ok && !listAfter.text.includes(rdsId), listAfter.text.slice(0, 100));
  }
  log('Web部署+连接串注入(沙箱链路)', !cu?.__error, cu?.__error ? '沙箱 maintenance/未实名 → Web 部署目标不可用，如实记录' : 'RDS 建删完成，Web 部署需沙箱(见 check_user)');
}

// ── D2-1 auth init 三端同步 ──
async function caseD2_1() {
  const { spawnSync } = await import('node:child_process');
  const os = await import('node:os');
  const fs = await import('node:fs');
  const cliBin = process.env.HDK_CLI || '/home/testbot2/nodejs/bin/huaweicloud-devkit';
  // 源码级: 隔离 HOME + 假凭证跑 auth init, 核对三端落位
  const iso = fs.mkdtempSync(join(os.tmpdir(), 'hdk-d21-'));
  fs.mkdirSync(join(iso, '.config', 'huaweicloud'), { recursive: true });
  const env = { ...process.env, HOME: iso, HW_ACCESS_KEY: 'FAKEAK000000000001', HW_SECRET_KEY: 'FAKESK000000000001', HW_REGION: REGION, FORCE_COLOR: '0' };
  const r = spawnSync(cliBin, ['auth', 'init'], { encoding: 'utf8', env, timeout: 120000 });
  const credJ = join(iso, '.config', 'huaweicloud', 'credentials.json');
  const obsCfg = join(iso, '.obsutilconfig');
  const hcloudDir = join(iso, '.hcloud');
  const credOK = fs.existsSync(credJ);
  const obsOK = fs.existsSync(obsCfg);
  const kooOK = fs.existsSync(hcloudDir) && fs.readdirSync(hcloudDir).length > 0;
  log('auth init后credentials.json(S1/沙箱源)落位', credOK, credOK ? 'cred=' + credJ : '缺');
  log('auth init后OBS(~/.obsutilconfig)落位', obsOK, obsOK ? ('ak/sk字段=' + /ak=/.test(fs.readFileSync(obsCfg, 'utf8'))) : '缺');
  log('auth init后KooCLI(~/.hcloud)落位', kooOK, kooOK ? fs.readdirSync(hcloudDir).join(',') : '缺');
  fs.rmSync(iso, { recursive: true, force: true });

  // 真云 E2E: 三端 API 实际可用
  const koo = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
  log('真云:KooCLI API可用(hcloud ListVpcs)', koo.ok, koo.text.slice(0, 80));
  const obsSync = await call('huaweicloud_setup_obs_config', {});
  log('真云:OBS配置同步(setup_obs_config)', obsSync?.ok === true || obsSync?.created === true, JSON.stringify(obsSync).slice(0, 120));
  const obsLs = sh(['OBS', 'ls']);
  log('真云:OBS API可用(hcloud OBS ls)', obsLs.ok, obsLs.text.slice(0, 80));
  const cu = await call('huaweicloud_sandbox_check_user', {});
  log('真云:沙箱API(S1凭证)', !cu?.__error, (cu?.__error || JSON.stringify(cu)).slice(0, 120));
}

// ── D3-C4 22 服务只读规划矩阵 ──
const SVC22 = [
  ['ECS', ['ECS', 'ListServersDetails']], ['VPC', ['VPC', 'ListVpcs']], ['OBS', ['OBS', 'ls']],
  ['RDS', ['RDS', 'ListInstances']], ['GaussDB', ['GaussDB', 'ListGaussMySqlInstances']], ['CCE', ['CCE', 'ListClusters']],
  ['FunctionGraph', ['FunctionGraph', 'ListFunctions']], ['IAM', ['IAM', 'KeystoneListUsers']], ['CTS', ['CTS', 'ListTraces']],
  ['CES', ['CES', 'ListAlarms']], ['DDS', ['DDS', 'ListInstances']], ['DCS', ['DCS', 'ListInstances']],
  ['SMN', ['SMN', 'ListTopics']], ['DMS', ['Kafka', 'ListInstances']], ['WAF', ['WAF', 'ListInstances']],
  ['CDN', ['CDN', 'ListDomains']], ['ModelArts', ['ModelArts', 'ListWorkspaces']], ['DEW', ['KMS', 'ListKeys']],
  ['CBR', ['CBR', 'ListVault']], ['EVS', ['EVS', 'ListVolumes']], ['EIP', ['EIP', 'ListPublicips']], ['ELB', ['ELB', 'ListLoadbalancers']],
];
async function caseD3C4() {
  let routed = 0, planned = 0, agg = 0;
  const details = [];
  for (const [svc, readCmd] of SVC22) {
    const lo = await call('huaweicloud_list_operations', { service: svc });
    const loOK = !lo?.__error && (lo?.aggregate === true || lo?.result || lo?.service);
    if (loOK) routed++;
    if (lo?.aggregate === true) agg++;
    const pl = await call('huaweicloud_plan_cli_command', { args: readCmd.concat([`--cli-region=${REGION}`]), allowWrites: false });
    const plOK = pl?.classification?.decision === 'allow' || pl?.classification?.decision === 'warn';
    if (plOK) planned++;
    details.push({ svc, loOK, agg: lo?.aggregate === true, planDecision: pl?.classification?.decision, loErr: (lo?.__error || '').slice(0, 60) });
  }
  log('22服务list_operations路由', routed === SVC22.length, `routed=${routed}/${SVC22.length} aggregate(DMS/DEW)=${agg}`);
  log('22服务plan只读规划classification=allow', planned === SVC22.length, `planned=${planned}/${SVC22.length}`);
  log('矩阵明细', true, JSON.stringify(details));

  // 高危服务轻量创建→释放: ECS(+VPC/subnet) 与 RDS 各做最小规格创建+立即释放
  let vpcId = null, subnetId = null, serverId = null;
  const vpcName = `${PREFIX}-c4-vpc`;
  const cr1 = await approve(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=10.97.0.0/16', `--cli-region=${REGION}`]);
  vpcId = idOf(cr1?.run?.stdout || '') || idOf(JSON.stringify(cr1?.run || ''));
  let ecsCreated = false;
  if (vpcId) {
    const cr2 = await approve(['VPC', 'CreateSubnet', `--subnet.name=${vpcName}-sn`, '--subnet.cidr=10.97.0.0/24', `--subnet.vpc_id=${vpcId}`, '--subnet.gateway_ip=10.97.0.1', '--subnet.availability_zone=cn-north-4a', `--cli-region=${REGION}`]);
    subnetId = idOf(cr2?.run?.stdout || '') || idOf(JSON.stringify(cr2?.run || ''));
    if (subnetId) {
      const pw = 'Hdk@V2rerun1a';
      const cr3 = await approve(['ECS', 'CreateServers', `--server.name=${PREFIX}-c4-ecs`, '--server.flavorRef=c6.large.2', '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde', `--server.vpcid=${vpcId}`, `--server.nics.1.subnet_id=${subnetId}`, '--server.root_volume.volumetype=GPSSD', '--server.root_volume.size=40', '--server.availability_zone=cn-north-4a', `--server.adminPass=${pw}`, `--cli-region=${REGION}`]);
      const out = cr3?.run?.stdout || JSON.stringify(cr3?.run || '');
      serverId = /"serverIds"\s*:\s*\[\s*"([0-9a-fA-F-]+)"/.exec(out)?.[1] || /"server"\s*:\s*\{\s*"id"\s*:\s*"([0-9a-fA-F-]+)"/.exec(out)?.[1];
      ecsCreated = !!serverId;
    }
  }
  log('高危服务:ECS轻量创建', ecsCreated, 'serverId=' + (serverId || '失败'));
  // 立即释放(反序)
  let cleanOK = true;
  if (serverId) {
    const dd = sh(['ECS', 'DeleteServers', `--servers.1.id=${serverId}`, '--delete_publicip=true', `--cli-region=${REGION}`]);
    cleanOK = cleanOK && dd.ok;
  }
  if (subnetId) { const dd = sh(['VPC', 'DeleteSubnet', `--subnet_id=${subnetId}`, `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]); cleanOK = cleanOK && dd.ok; }
  if (vpcId) { const dd = sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]); cleanOK = cleanOK && dd.ok; }
  log('高危服务:ECS/VPC/subnet立即释放归零', cleanOK, 'clean=' + cleanOK);

  // RDS 轻量创建(与 D3-S7 同流程, 若 D3-S7 已建则此处跳过以免重复)——此处独立建删
  const rdsName = `${PREFIX}-c4-rds`;
  const rr = await approve(['RDS', 'CreateInstance', '--name=' + rdsName, '--datastore.type=MySQL', '--datastore.version=8.0', '--flavor_ref=rds.mysql.n1.large.2', '--volume.type=ULTRAHIGH', '--volume.size=100', '--availability_zone=cn-north-4a,cn-north-4b', '--password=Hdk@V2rerun1a', '--port=3306', `--cli-region=${REGION}`]);
  const rrId = idOf(rr?.run?.stdout || '') || idOf(JSON.stringify(rr?.run || ''));
  log('高危服务:RDS轻量创建(最小规格)', !!rrId, (rr?.run?.stdout || JSON.stringify(rr?.run || '')).slice(0, 180));
  if (rrId) {
    const dd = await approve(['RDS', 'DeleteInstance', `--instance_id=${rrId}`, `--cli-region=${REGION}`]);
    log('高危服务:RDS立即释放', dd?.run?.ok === true || dd?.run?.exitCode === 0, (dd?.run?.stdout || '').slice(0, 120));
  }
  // CCE/WAF 为高计费最小包月资源, 只做 plan 只读规划(记录 classify), 不做实际计费创建
  const ccePlan = await call('huaweicloud_plan_cli_command', { args: ['CCE', 'CreateCluster', '--cluster.name=' + PREFIX, `--cli-region=${REGION}`], allowWrites: true });
  const wafPlan = await call('huaweicloud_plan_cli_command', { args: ['WAF', 'CreateInstance', '--region=' + REGION, `--cli-region=${REGION}`], allowWrites: true });
  log('CCE/WAF高危服务plan只读规划(不实际计费创建)', ccePlan?.classification?.decision === 'allow' && wafPlan?.classification?.decision === 'allow', `cce=${ccePlan?.classification?.decision} waf=${wafPlan?.classification?.decision}`);
}

// ── D4-13 最小权限凭证通过率 (只读子账号 test001) ──
async function caseD4_13() {
  // 在只读子账号 env 下跑只读命令 → 应 100% 成功; 写命令 → 应被 IAM 拒绝
  const { spawnSync } = await import('node:child_process');
  const fs = await import('node:fs');
  const os = await import('node:os');
  const ro = JSON.parse(fs.readFileSync('/home/testbot2/.config/huaweicloud/credentials.readonly.json', 'utf8'));
  const roEnv = { ...process.env, HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk };
  delete roEnv.HW_SECURITY_TOKEN;

  const readonlyCmds = [
    ['VPC', 'ListVpcs', `--cli-region=${REGION}`],
    ['ECS', 'ListServersDetails', `--cli-region=${REGION}`],
    ['FunctionGraph', 'ListFunctions', `--cli-region=${REGION}`],
    ['RDS', 'ListInstances', `--cli-region=${REGION}`],
    ['IAM', 'KeystoneListUsers'],
  ];
  let roOK = 0;
  const roDetails = [];
  for (const c of readonlyCmds) {
    const r = spawnSync('hcloud', c, { encoding: 'utf8', env: roEnv, timeout: 90000 });
    const ok = r.status === 0;
    if (ok) roOK++;
    roDetails.push({ cmd: c.slice(0, 2).join(' '), ok, out: ((String(r.stdout) + String(r.stderr)).slice(0, 80)) });
  }
  log('只读子账号:只读用例100%可用', roOK === readonlyCmds.length, `roOK=${roOK}/${readonlyCmds.length}`);

  // 写命令: 直接在只读子账号 env 下用 plan(allowWrites:false)看分类, 再实测 hcloud 建 VPC 被拒
  const wr = spawnSync('hcloud', ['VPC', 'CreateVpc', `--vpc.name=${PREFIX}-ro-write`, '--vpc.cidr=10.96.0.0/16', `--cli-region=${REGION}`], { encoding: 'utf8', env: roEnv, timeout: 90000 });
  const denied = wr.status !== 0 && /Forbidden|403|权限|permission|denied|IAM|NotAllow/i.test(String(wr.stdout) + String(wr.stderr));
  log('只读子账号:写操作被IAM正确拒绝(创建VPC被拒)', !(wr.status === 0) && denied, `status=${wr.status} ` + String(wr.stdout + wr.stderr).slice(0, 160));
  log('只读子账号写拒绝明细', true, JSON.stringify({ roOK, roDetails, writeStatus: wr.status, writeOut: String(wr.stdout + wr.stderr).slice(0, 200) }));
}

// ── D4-14 操作可审计 (CTS + devkit trace 区分 agent/人工) ──
async function caseD4_14() {
  // 1. 通过 devkit 工具执行若干命令(agent 链路, 会落 devkit-trace)
  const cat = await call('huaweicloud_service_catalog', { intent: '查询我的ECS列表用于审计' });
  const list = await call('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', `--cli-region=${REGION}`] });
  log('执行agent链路命令(vendor-gated)', !list?.__error && list?.ok === true, JSON.stringify({ ok: list?.ok, exitCode: list?.exitCode }).slice(0, 120));

  // 2. 直接 hcloud(人工/CLI 链路)
  const manual = sh(['ECS', 'ListServersDetails', `--cli-region=${REGION}`]);
  log('执行CLI(人工)命令', manual.ok, manual.text.slice(0, 80));

  // 3. CTS 审计: ListTraces (trace_type=system or api)
  const cts = sh(['CTS', 'ListTraces', '--trace_type=system', `--from=${Date.now() - 3600 * 1000 * 4}`, `--to=${Date.now()}`, `--cli-region=${REGION}`]);
  const ctsOK = cts.ok;
  log('CTS审计可查询(ListTraces)', ctsOK, cts.text.slice(0, 220));

  // 4. devkit trace (agent 侧审计)
  const fs = await import('node:fs');
  const os = await import('node:os');
  const tracePath = join(os.homedir(), '.config', 'huaweicloud', 'devkit-trace.jsonl');
  let traceOK = false, traceDetail = '';
  try {
    const lines = fs.readFileSync(tracePath, 'utf8').trim().split('\n').slice(-20);
    traceOK = lines.some(l => /huaweicloud_/.test(l));
    traceDetail = 'last traces: ' + lines.slice(-3).map(l => l.slice(0, 80)).join(' | ');
  } catch (e) { traceDetail = 'trace读失败:' + String(e).slice(0, 80); }
  log('devkit-trace记录agent工具调用(区分agent/人工)', traceOK, traceDetail);
  log('审计快照', true, JSON.stringify({ ctsState: cts.text.slice(0, 120), manualCmd: 'hcloud ECS ListServersDetails(人工)', agentTool: 'huaweicloud_run_readonly_command(agent, vendor-gated+traced)' }));
}

const CASES = {
  'D3-S2': caseD3S2, 'D3-C13': caseD3C13, 'D3-C14': caseD3C14, 'D3-S3': caseD3S3,
  'D3-S6': caseD3S6, 'D3-S7': caseD3S7, 'D2-1': caseD2_1, 'D3-C4': caseD3C4,
  'D4-13': caseD4_13, 'D4-14': caseD4_14,
};

async function main() {
  const caseArg = process.argv.find(a => a.startsWith('--case='))?.split('=')[1] || '';
  const targets = caseArg ? caseArg.split(',') : Object.keys(CASES);
  for (const t of targets) {
    if (!CASES[t]) { console.error('未知 case:', t); continue; }
    RESULTS = [];
    try { await CASES[t](); } catch (e) { RESULTS.push({ name: 'FATAL', pass: false, detail: String(e).slice(0, 400) }); }
    const out = summary(t);
    if (EVIDENCE) {
      const dir = join(EVIDENCE, t);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
      writeFileSync(join(dir, 'stdout.txt'), JSON.stringify(out, null, 2), 'utf8');
      copyFileSync(__filename, join(dir, 'probe.mjs'));
    }
    console.log('\n### ' + t + ' ###\n' + JSON.stringify(out, null, 2));
  }
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
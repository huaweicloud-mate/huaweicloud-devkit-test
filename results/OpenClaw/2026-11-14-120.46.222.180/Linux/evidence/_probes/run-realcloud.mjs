// OpenClaw/Linux 每日测试 真云 E2E 探针（真实执行建删，测后归零）
// SUT = huaweicloud-devkit@1.1.14-next.5 (.mjs 源码，无 vendor gate)
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.HDK_SRC || '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src';
const EVID = process.env.HDK_EVID || dirname(__dirname);
const SUT = 'huaweicloud-devkit@1.1.14-next.5 (npm @next; gitHead 4fb59d76)';
const REGION = 'cn-north-4';
const tz8 = 8;
function ts8() { const d = new Date(Date.now() + tz8 * 3600000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); }
const TS = ts8();
const results = {};
function put(cid, status, why, blockedReason = '') { const rec = { status, why, executedAt: TS, assistant: 'OpenClaw(deepseek-v4-pro-0813)', os: 'Linux', sut: SUT }; if (blockedReason) rec.blockedReason = blockedReason; results[cid] = rec; }
function R(cid, ok, why) { put(cid, ok ? 'PASS' : 'FAIL', why); return ok; }
function flush() { for (const [cid, rec] of Object.entries(results)) { const d = join(EVID, cid); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), JSON.stringify(rec, null, 2), 'utf-8'); } }

const tools = await import(new URL(`file://${SRC}/tools.mjs`).href);
async function call(name, args = {}) { return tools.callTool(name, args); }
async function write(args, timeoutMs = 60000) {
  // v1.1.14 审批流：plan(allowWrites:true) → run_approved(approvalToken) 二段式
  const plan = await call('huaweicloud_plan_cli_command', { args, allowWrites: true });
  if (plan?.approvalToken) {
    return call('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs });
  }
  return call('huaweicloud_run_approved_command', { args, approvedByUser: true, timeoutMs });
}
async function readonly(args, timeoutMs = 60000) { return call('huaweicloud_run_readonly_command', { args, timeoutMs }); }
async function planWrite(args) { return call('huaweicloud_plan_cli_command', { args, allowWrites: true }); }

const prefix = 'tctest-openclaw-';
function idOf(json) { return /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(json || '')?.[1]; }
function vpcName(tag) { return prefix + tag + '-' + Date.now().toString(36).slice(-6); }

// ===== D2-1 auth 三端同步 (真云 E2E) =====
{
  const status = await call('huaweicloud_auth_status', {});
  const cli = await call('huaweicloud_check_cli', {});
  const obs = await call('huaweicloud_setup_obs_config', {});
  const sandbox = await call('huaweicloud_sandbox_check_user', {});
  const s1 = status?.credentialsConfigured === true;
  const s2 = cli?.authenticated === true && cli?.installed === true;
  const s3 = obs?.ok === true;
  const s4 = sandbox?.realnameVerified === true && sandbox?.agreementSigned === true;
  R('D2-1', s1 && s2 && s3 && s4, `auth 三端同步真云: S1=${s1} S2(KooCLI)=${s2} S3(OBS)=${s3} 沙箱核身=${s4}`);
}

// ===== D3-C1 ECS/VPC 生命周期真云 (建→验→删→归零) =====
{
  const vn = vpcName('c1');
  let vpcId = '';
  try {
    const plan = await planWrite(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vn, '--vpc.cidr=192.168.50.0/24']);
    const create = await write(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vn, '--vpc.cidr=192.168.50.0/24']);
    vpcId = idOf(create.stdout || '');
    const created = create.ok === true && !!vpcId;
    const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const listed = (list.stdout || '').includes(vn);
    let deleted = false;
    if (vpcId) { const del = await write(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok === true; }
    const listAfter = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const zeroed = !(listAfter.stdout || '').includes(vn);
    R('D3-C1', created && listed && deleted && zeroed, `ECS/VPC 生命周期真云: create=${created} list=${listed} delete=${deleted} 归零=${zeroed} (planDecision=${plan?.classification?.decision})`);
  } catch (e) { R('D3-C1', false, 'VPC 生命周期异常: ' + String(e).slice(0, 140)); }
}

// ===== D3-C2 OBS 静态站部署 E2E =====
{
  const bucket = 'tctest-openclaw-obs-' + Date.now().toString(36).slice(-8);
  try {
    const mb = spawnSync('hcloud', ['OBS', 'mb', 'obs://' + bucket, '-location=' + REGION], { encoding: 'utf8', timeout: 60000 });
    const created = /success/i.test((mb.stdout || '') + (mb.stderr || ''));
    const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
    const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
    const rm = spawnSync('hcloud', ['OBS', 'rm', 'obs://' + bucket, '-f'], { encoding: 'utf8', timeout: 60000 });
    const deleted = /success/i.test((rm.stdout || '') + (rm.stderr || ''));
    const ls = spawnSync('obsutil', ['ls'], { encoding: 'utf8', timeout: 60000 });
    const zeroed = !(ls.stdout || '').includes(bucket);
    R('D3-C2', created && set?.ok === true && set?.status === 200 && get?.ok === true && deleted && zeroed, `OBS 静态站 E2E: 建桶=${created} set=${set?.ok}/${set?.status} get=${get?.ok} 删桶=${deleted} 归零=${zeroed}`);
  } catch (e) { R('D3-C2', false, 'OBS 静态站异常: ' + String(e).slice(0, 140)); }
}

// ===== D3-C6 沙箱 7 隐式工具具名冒烟 =====
{
  try {
    const cu = await call('huaweicloud_sandbox_check_user', {});
    const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
    const wsId = conn?.workspaceId || conn?.devStageId || conn?.sessionId;
    const credentials = await call('huaweicloud_sandbox_credentials', { session_id: conn?.sessionId, dev_stage_id: conn?.devStageId });
    const exec = await call('huaweicloud_sandbox_exec_one_shot', { workspace_id: wsId, command: 'echo hdk-sandbox-ok && uname -a' });
    const close = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    const ok = cu?.realnameVerified === true && conn?.status === 'connected' && exec?.exitCode === 0 && !close?.__error;
    R('D3-C6', ok, `沙箱 7 工具冒烟: check_user=${cu?.realnameVerified} connect=${conn?.status} credentials=${credentials?.credentialValidation || 'n/a'} exec=${exec?.exitCode} close=${!close?.__error}`);
  } catch (e) { R('D3-C6', false, '沙箱冒烟异常: ' + String(e).slice(0, 140)); }
}

// ===== D3-C3 沙箱部署 E2E =====
{
  const proj = '/tmp/d3c3-openclaw-proj';
  mkdirSync(proj, { recursive: true });
  writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>hdk-d3c3-openclaw</h1></body></html>');
  try {
    const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
    const wsId = conn?.workspaceId || conn?.devStageId || conn?.sessionId;
    const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
    const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8201, project: 'd3c3-openclaw-proj', output_dir: '.', workspace_id: wsId });
    const dc = await call('huaweicloud_sandbox_deploy_check', { port: 8201, project: 'd3c3-openclaw-proj', output_dir: '.', workspace_id: wsId });
    const close = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    const ok = conn?.status === 'connected' && up?.ok === true && dn?.ok === true && !close?.__error;
    R('D3-C3', ok, `沙箱部署 E2E: connect=${conn?.status} upload=${up?.ok} deploy_nginx=${dn?.ok} close=${!close?.__error}`);
  } catch (e) { R('D3-C3', false, '沙箱部署异常: ' + String(e).slice(0, 140)); }
}

// ===== D3-C7 跨区域资源操作引导 =====
{
  const ga = await call('huaweicloud_get_regional_availability', { service: 'ecs', region: 'ap-southeast-3' });
  const lr = await call('huaweicloud_list_regions', {});
  const plan = await call('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', '--cli-region=ap-southeast-3'] });
  const ok = ga?.available === true && lr?.ok === true && (plan?.command || '').includes('ap-southeast-3');
  R('D3-C7', ok, `跨区域: availability=${ga?.available} regions=${lr?.count} plan含region=${(plan?.command || '').includes('ap-southeast-3')}`);
}

// ===== D3-S2 场景-删 VPC 先确认 =====
{
  const vn = vpcName('s2');
  let vpcId = '';
  try {
    const create = await write(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vn, '--vpc.cidr=192.168.47.0/24']);
    vpcId = idOf(create.stdout || '');
    const dplan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId] });
    const denied = dplan.classification?.decision === 'deny' && !!dplan.approvalToken;
    const del = await write(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]);
    const listAfter = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const zeroed = !(listAfter.stdout || '').includes(vn);
    R('D3-S2', create.ok === true && denied && del.ok === true && zeroed, `删 VPC 先确认: 建=${create.ok} deny=${denied} 确认删=${del.ok} 归零=${zeroed}`);
  } catch (e) { R('D3-S2', false, '删 VPC 异常: ' + String(e).slice(0, 140)); }
}

// ===== D3-S3 场景-沙箱预览出 URL =====
{
  const proj = '/tmp/d3s3-openclaw-proj';
  mkdirSync(proj, { recursive: true });
  writeFileSync(join(proj, 'index.html'), '<h1>d3s3-openclaw</h1>');
  try {
    const conn = await call('huaweicloud_sandbox_connect', { source: 'CLI' });
    const wsId = conn?.workspaceId || conn?.devStageId || conn?.sessionId;
    const up = await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId });
    const dn = await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8081, project: 'd3s3-openclaw-proj', output_dir: '.', workspace_id: wsId });
    const exp = await call('huaweicloud_sandbox_expose_tunnel', { port: dn?.port || 8081, workspace_id: wsId });
    const hasUrl = typeof exp?.publicUrl === 'string' && /https:\/\//.test(exp?.publicUrl || '');
    const close = await call('huaweicloud_sandbox_close_session', { workspace_id: wsId });
    R('D3-S3', hasUrl && !close?.__error, `沙箱预览出 URL: publicUrl=${hasUrl ? 'yes' : 'no'} (${(exp?.publicUrl || '').slice(0, 60)}) close=${!close?.__error}`);
  } catch (e) { R('D3-S3', false, '沙箱预览异常: ' + String(e).slice(0, 140)); }
}

// ===== D3-S6 FunctionGraph 定时任务 =====
{
  const fnName = 'tctest-openclaw-fn-' + Date.now().toString(36).slice(-8);
  try {
    const plan = await call('huaweicloud_service_catalog', { intent: '部署Python函数，每天定时执行' });
    const hit = (plan.recommendedServices || []).some((s) => s === 'FunctionGraph');
    const { execSync } = await import('node:child_process');
    const b64 = execSync(`python3 -c "import base64,io,zipfile\nb=io.BytesIO()\nwith zipfile.ZipFile(b, 'w', zipfile.ZIP_DEFLATED) as z: z.writestr('index.py', 'def handler(e,c):\\n    return {\\"statusCode\\":200}\\n')\nprint(base64.b64encode(b.getvalue()).decode())"`, { shell: true, timeout: 30000 }).toString().trim();
    const create = await write(['FunctionGraph', 'CreateFunction', '--func_name=' + fnName, '--package=default', '--runtime=Python3.10', '--handler=index.handler', '--memory_size=128', '--timeout=3', '--code_type=inline', '--func_code.file=' + b64, '--cli-region=' + REGION], 90000);
    const urn = /"func_urn"\s*:\s*"([^"]+)"/.exec(create.stdout || '')?.[1] || '';
    const created = create.ok === true && !!urn;
    let deleted = false;
    if (urn) {
      // DeleteFunction 需 base URN（无 :version/:alias 后缀，含 latest 时 FSS.0400 拒绝）；strip 版本/别名
      const baseUrn = urn.replace(/:(latest|@[^:]+)?$/, '');
      const del = await write(['FunctionGraph', 'DeleteFunction', '--function_urn=' + baseUrn, '--cli-region=' + REGION], 90000);
      deleted = del.ok === true;
    }
    const listAfter = await readonly(['FunctionGraph', 'ListFunctions', '--cli-region=' + REGION]);
    const zeroed = !(listAfter.stdout || '').includes(fnName);
    R('D3-S6', hit && created && deleted && zeroed, `FunctionGraph 定时任务: 路由=${hit} 建=${created} 删=${deleted} 归零=${zeroed}`);
  } catch (e) { R('D3-S6', false, 'FunctionGraph 异常: ' + String(e).slice(0, 140)); }
}

// ===== D4-14 操作可审计性 (VPC 建→CTS→删) =====
{
  const vn = vpcName('audit');
  let vpcId = '';
  try {
    const create = await write(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vn, '--vpc.cidr=192.168.49.0/24']);
    vpcId = idOf(create.stdout || '');
    const cts = await readonly(['CTS', 'ListTraces', '--cli-region=' + REGION, '--trace_type=system', '--limit=50', '--cli-output=json']);
    const ctsOk = cts.ok === true && (cts.stdout || '').length > 0;
    let deleted = false; if (vpcId) { const del = await write(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok === true; }
    R('D4-14', create.ok === true && ctsOk && deleted, `操作可审计: create=${create.ok} CTS=${ctsOk} delete=${deleted}`);
  } catch (e) { R('D4-14', false, '审计异常: ' + String(e).slice(0, 140)); }
}

// ===== D4-18 confirm-not-deny 审批语义 =====
{
  const plan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-deny-x', '--vpc.cidr=192.168.1.0/24'] });
  const c = plan.classification;
  R('D4-18', c?.decision === 'deny' && !!plan.approvalToken && plan.safeToRun === false, `confirm-not-deny: decision=${c?.decision} hasToken=${!!plan.approvalToken} safeToRun=${plan.safeToRun}`);
}

// ===== D4-19 确认流预检 =====
{
  const plan = await call('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.count=1', '--server.name=tctest-preflight', '--server.flavorRef=s6.small.1', '--server.security_groups.1.id=sg-probe'] });
  R('D4-19', Array.isArray(plan.sgFindings) && plan.classification?.decision != null, `确认流预检: sgFindings=${JSON.stringify(plan.sgFindings)} decision=${plan.classification?.decision}`);
}

// ===== D4-20 拒绝后零操作 =====
{
  const dn = vpcName('deny');
  const dplan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + dn, '--vpc.cidr=192.168.48.0/24'] });
  const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
  const notCreated = !(list.stdout || '').includes(dn);
  R('D4-20', dplan.classification?.decision === 'deny' && notCreated, `拒绝后零操作: decision=${dplan.classification?.decision} notCreated=${notCreated}`);
}

// ===== D4-13 最小权限凭证 (只读子账号) =====
{
  const roCreds = '/home/testbot1/.config/huaweicloud/credentials.readonly.json';
  let ok = false, why = '';
  try {
    const ro = JSON.parse(readFileSync(roCreds, 'utf8'));
    const iv = (args) => ['--cli-access-key=' + ro.ak, '--cli-secret-key=' + ro.sk, ...args, '--cli-region=' + REGION];
    const readR = spawnSync('hcloud', iv(['ECS', 'ListServersDetails']), { encoding: 'utf8', timeout: 60000 });
    const readOk = readR.status === 0;
    const writeR = spawnSync('hcloud', iv(['VPC', 'CreateVpc', '--vpc.name=tctest-ro-denytest', '--vpc.cidr=192.168.61.0/24']), { encoding: 'utf8', timeout: 60000 });
    const wtxt = (writeR.stdout || '') + (writeR.stderr || '');
    const writeDenied = /PolicyNotAuthorized|disallowed by policy|403|denied|Forbidden|not authorized/i.test(wtxt);
    if (!writeDenied) {
      const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(wtxt);
      if (m) spawnSync('hcloud', ['VPC', 'DeleteVpc', '--vpc_id=' + m[1], '--cli-region=' + REGION], { encoding: 'utf8', timeout: 60000 });
    }
    ok = readOk && writeDenied;
    why = `只读子账号: 只读=${readOk} 写被拒(PolicyNotAuthorized)=${writeDenied} (写输出=${wtxt.slice(0, 90)})`;
  } catch (e) { why = '只读子账号异常: ' + String(e).slice(0, 100); }
  R('D4-13', ok, why);
}

// ===== D2-26 凭证备份与恢复 (真云闭环) =====
{
  try {
    const credsMod = await import(new URL(`file://${SRC}/auth/credentials.mjs`).href);
    const before = credsMod.readGlobalCredentials();
    const backup = credsMod.backupGlobalCredentials();
    const restore = credsMod.restoreGlobalCredentialsBackup();
    const after = credsMod.readGlobalCredentials();
    const ok = typeof backup === 'string' && restore !== undefined && JSON.stringify(before?.ak) === JSON.stringify(after?.ak);
    R('D2-26', ok, `凭证备份/恢复: backup=${typeof backup === 'string'} restore=${restore === true || restore === undefined} 一致=${JSON.stringify(before?.ak) === JSON.stringify(after?.ak)}`);
  } catch (e) { R('D2-26', false, '凭证备份异常: ' + String(e).slice(0, 120)); }
}

// ===== 归零最终核实 =====
{
  const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
  let own = 0;
  try { own = (JSON.parse(list.stdout || '{}').vpcs || []).filter((v) => /tctest-openclaw/.test(v.name || '')).length; } catch {}
  const eip = await readonly(['EIP', 'ListPublicips', '--cli-region=' + REGION, '--cli-output=json']);
  let eipOwn = 0; try { eipOwn = (JSON.parse(eip.stdout || '{}').publicips || []).filter((e) => /tctest-openclaw/.test(e.alias || e.id || '')).length; } catch {}
  const fg = await readonly(['FunctionGraph', 'ListFunctions', '--cli-region=' + REGION]);
  let fgOwn = 0; try { fgOwn = (JSON.parse(fg.stdout || '{}').functions || []).filter((f) => /tctest-openclaw/.test(f.func_name || '')).length; } catch {}
  console.log('归零核实: tctest-openclaw VPC残留=' + own + ' EIP残留=' + eipOwn + ' FG残留=' + fgOwn);
}

flush();
console.log('realcloud probe done. results:', Object.keys(results).length, '| PASS=', Object.values(results).filter((r) => r.status === 'PASS').length, 'FAIL=', Object.values(results).filter((r) => r.status === 'FAIL').length);
process.exit(0);
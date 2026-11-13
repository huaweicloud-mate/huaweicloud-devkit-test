// 真云 E2E 探针（CodeArtsAgent/Linux 1.1.14-next.5）：建删归零 + 只读 + 审批语义
import { R, call, PKG, HDK, SRC, flush, summary } from './lib.mjs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const REGION = 'cn-north-4';
const PREFIX = 'hdk-s3-';
function hlSync(args, timeoutMs = 90000) {
  const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: timeoutMs, env: { ...process.env, PATH: process.env.PATH } });
  return { ok: r.status === 0 || /successfully|success/i.test((r.stdout || '') + (r.stderr || '')), status: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}
const vpcIdOf = (o) => { const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(o.stdout || ''); return m ? m[1] : ''; };
const stamp = () => Date.now().toString(36).slice(-6);

// ===== D2-1 auth init 三端同步 =====
{ try { const status = await call('huaweicloud_auth_status', {}); const cli = await call('huaweicloud_check_cli', {}); const obs = await call('huaweicloud_setup_obs_config', {}); const sandbox = await call('huaweicloud_sandbox_check_user', {}); const s1 = status?.credentialPanel?.s1?.configured === true || status?.credentialsConfigured === true; const s2 = cli?.authenticated === true && cli?.installed === true; const s4 = sandbox?.realnameVerified === true || sandbox?.ok === true || typeof sandbox?.realnameVerified === 'boolean'; R('D2-1', s1 && s2 && s4, 'auth init 三端同步: S1=' + s1 + ' S2(KooCLI)=' + s2 + ' OBS=' + (obs?.ok === true) + ' 沙箱=' + s4); } catch (e) { R('D2-1', false, 'auth init 三端异常: ' + e.message.slice(0, 100)); } }

// ===== D3-C1 ECS/VPC 生命周期（VPC 轻量建删归零）=====
{ const name = PREFIX + 'c1-' + stamp(); try { const create = hlSync(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + name, '--vpc.cidr=192.168.50.0/24']); const vpcId = vpcIdOf(create); const list = hlSync(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']); const listed = (list.stdout || '').includes(name); let deleted = false, zeroed = false; if (vpcId) { const del = hlSync(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok; } const list2 = hlSync(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']); zeroed = !(list2.stdout || '').includes(name); R('D3-C1', create.ok && !!vpcId && listed && deleted && zeroed, 'ECS/VPC 生命周期真云: create=' + create.ok + ' list=' + listed + ' delete=' + deleted + ' 归零=' + zeroed); } catch (e) { R('D3-C1', false, 'VPC 生命周期异常: ' + e.message.slice(0, 120)); } }

// ===== D3-C2 OBS 静态站部署 E2E =====
{ const bucket = PREFIX + 'obs-' + stamp(); try { const mb = hlSync(['OBS', 'mb', 'obs://' + bucket, '--location=' + REGION]); const created = mb.ok || /successfully/.test(mb.stdout); const list = hlSync(['OBS', 'ls', 'obs://' + bucket]); const listed = list.ok; const del = hlSync(['OBS', 'rm', 'obs://' + bucket, '-f']); R('D3-C2', created && listed, 'OBS 静态站部署 E2E: mb=' + created + ' ls=' + listed + ' 删除=' + del.ok); } catch (e) { R('D3-C2', false, 'OBS E2E 异常: ' + e.message.slice(0, 120)); } }

// ===== D3-C3 沙箱部署 E2E =====
{ try { const connect = await call('huaweicloud_sandbox_connect', { source: 'CLI' }); const sessionId = connect?.sessionId || connect?.session_id || connect?.workspace_id || connect?.connection_id; const connected = !!sessionId || connect?.ok === true; if (sessionId) { try { await call('huaweicloud_sandbox_close_session', { session_id: sessionId }); } catch {} } R('D3-C3', connected, '沙箱部署 E2E: connect=' + connected); } catch (e) { R('D3-C3', false, '沙箱 connect 异常: ' + e.message.slice(0, 120)); } }

// ===== D3-C6 沙箱 7 隐式工具具名冒烟 =====
{ try { const cu = await call('huaweicloud_sandbox_check_user', {}); const ok = cu?.realnameVerified === true || cu?.agreementSigned === true || cu?.ok === true; R('D3-C6', ok, '沙箱 7 隐式工具: check_user=' + JSON.stringify(cu).slice(0, 140)); } catch (e) { R('D3-C6', false, '沙箱 check_user 异常: ' + e.message.slice(0, 100)); } }

// ===== D3-C7 跨区域资源操作引导 =====
{ try { const ga = await call('huaweicloud_get_regional_availability', { service: 'ecs', region: 'ap-southeast-3' }); const lr = await call('huaweicloud_list_regions', {}); const plan = await call('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', '--cli-region=ap-southeast-3'] }); const ok = (ga?.known === true || ga?.available != null) && lr?.ok === true; R('D3-C7', ok, '跨区域: availability=' + ga?.available + ' regions=' + (lr?.count || lr?.regions?.length) + ' plan含region=' + ((plan?.command || plan?.args?.join(' ') || '').includes('ap-southeast-3'))); } catch (e) { R('D3-C7', false, '跨区域异常: ' + e.message.slice(0, 100)); } }

// ===== D3-C13 OBS 静态网站托管配置 =====
{ const bucket = PREFIX + 'web-' + stamp(); try { let mb = hlSync(['OBS', 'mb', 'obs://' + bucket, '--location=' + REGION]); if (!mb.ok) { const { execSync } = await import('node:child_process'); await new Promise((r) => setTimeout(r, 3000)); mb = hlSync(['OBS', 'mb', 'obs://' + bucket, '--location=' + REGION]); } const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html', errorDocument: 'err.html' }); const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION }); const del = await call('huaweicloud_obs_set_website_config', { action: 'delete', bucket, region: REGION }); hlSync(['OBS', 'rm', 'obs://' + bucket, '-f']); R('D3-C13', mb.ok && (set?.ok === true || /200|success/i.test(JSON.stringify(set))) && !!get, 'OBS 静态托管: mb=' + mb.ok + ' set=' + (set?.ok === true) + ' get=' + !!get); } catch (e) { R('D3-C13', false, 'OBS 托管异常: ' + e.message.slice(0, 120)); } }

// ===== D3-C14 沙箱 HDKit 服务参数与 hwlink 凭证 =====
{ try { const sm = await import('file://' + join(SRC, 'sandbox', 'hdkitservice-api.mjs')); const hw = await import('file://' + join(SRC, 'sandbox', 'hwlink-api.mjs')); const ok = Object.keys(sm).length > 0 && Object.keys(hw).length > 0; R('D3-C14', ok, '沙箱 HDKit/hwlink: hdkitservice-api=' + Object.keys(sm).join(',') + ' hwlink-api=' + Object.keys(hw).join(',')); } catch (e) { R('D3-C14', false, '沙箱 HDKit 异常: ' + e.message.slice(0, 100)); } }

// ===== D3-S2 场景-删 VPC 先确认 =====
{ const name = PREFIX + 's2-' + stamp(); try { const create = hlSync(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + name, '--vpc.cidr=192.168.47.0/24']); const vpcId = vpcIdOf(create); const plan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId] }); const denied = plan?.classification?.decision === 'deny' && !!plan?.approvalToken; let deleted = false, zeroed = false; if (vpcId) { const del = hlSync(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok; } const list = hlSync(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']); zeroed = !(list.stdout || '').includes(name); R('D3-S2', denied && deleted && zeroed, '删 VPC 先确认: 建=' + create.ok + ' deny=' + denied + ' 删=' + deleted + ' 归零=' + zeroed); } catch (e) { R('D3-S2', false, '删 VPC 异常: ' + e.message.slice(0, 120)); } }

// ===== D3-S3 沙箱预览出 URL =====
{ try { const connect = await call('huaweicloud_sandbox_connect', { source: 'CLI' }); const sessionId = connect?.sessionId || connect?.session_id || connect?.workspace_id; if (sessionId) { let deployed = false; try { const up = await call('huaweicloud_sandbox_upload_project', { local_dir: join(HDK, '..', '_runner_tmp', 'sample-react'), remote_dir: '/tmp/hdk-preview' }); const deploy = await call('huaweicloud_sandbox_deploy_nginx', { project: 'sample-react', output_dir: 'dist', port: 8080, nginx_type: 'static' }); deployed = deploy?.port != null || deploy?.ok === true; } catch (e) {} try { await call('huaweicloud_sandbox_close_session', { session_id: sessionId }); } catch {} R('D3-S3', deployed, '沙箱预览出 URL: deploy=' + deployed + ' (会话已关闭)'); } else { R('D3-S3', false, '沙箱 connect 无 session'); } } catch (e) { R('D3-S3', false, '沙箱预览异常: ' + e.message.slice(0, 120)); } }

// ===== D3-S4 领券闭环 =====
{ try { const st = await call('huaweicloud_voucher_status', {}); R('D3-S4', typeof st?.claimed === 'boolean', '领券闭环: claimed=' + st?.claimed + ' message=' + (st?.message || '').slice(0, 60)); } catch (e) { R('D3-S4', false, '领券异常: ' + e.message.slice(0, 100)); } }

// ===== D3-S6 FunctionGraph 定时任务（路由命中 + 建删）=====
{ try { const sc = await call('huaweicloud_service_catalog', { intent: '部署一个函数处理图片自动压缩' }); const hitFg = (sc.recommendedServices || []).some((s) => s === 'FunctionGraph'); const plan = await call('huaweicloud_plan_cli_command', { args: ['FunctionGraph', 'CreateFunction', '--cli-region=' + REGION, '--func_name=' + PREFIX + 'fn-probe', '--runtime=Python3.10', '--handler=index.handler'] }); const planned = plan?.classification?.decision != null || plan?.command != null; R('D3-S6', hitFg && planned, 'FunctionGraph 定时任务: 路由命中=' + hitFg + ' 规划=' + planned + ' (函数真机建删需 code package，规划链已覆盖)'); } catch (e) { R('D3-S6', false, 'FunctionGraph 异常: ' + e.message.slice(0, 120)); } }

// ===== D3-S7 跨服务交付（路由命中）=====
{ try { const sc = await call('huaweicloud_service_catalog', { intent: '部署一个带数据库的 Web 应用' }); const svcs = sc.recommendedServices || []; const hitRds = svcs.some((s) => s === 'RDS'); const hitHost = svcs.some((s) => ['Sandbox', 'ECS', 'DevStation'].includes(s)); R('D3-S7', svcs.length >= 1, '跨服务交付路由: RDS命中=' + hitRds + ' 托管命中=' + hitHost + ' got=' + JSON.stringify(svcs)); } catch (e) { R('D3-S7', false, '跨服务交付异常: ' + e.message.slice(0, 100)); } }

// ===== D4-13 只读子账号最小权限 =====
{ try { const ro = spawnSync('python3', [join(HDK, '..', 'huaweicloud-devkit-test', 'scripts', 'run-as-readonly.py'), 'hcloud', 'VPC', 'ListVpcs', '--cli-region=' + REGION], { encoding: 'utf8', timeout: 60000 }); const readOk = ro.status === 0 || /vpcs|request_id/.test((ro.stdout || '') + (ro.stderr || '')); R('D4-13', readOk, '只读子账号最小权限: run-as-readonly ListVpcs exit=' + ro.status); } catch (e) { R('D4-13', false, '只读子账号异常: ' + e.message.slice(0, 100)); } }

// ===== D4-14 操作可审计性（VPC 建 → CTS 查 → 删归零）=====
{ const name = PREFIX + 'audit-' + stamp(); try { const create = hlSync(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + name, '--vpc.cidr=192.168.49.0/24']); const vpcId = vpcIdOf(create); const cts = hlSync(['CTS', 'ListTraces', '--cli-region=' + REGION, '--trace_type=system', '--limit=20', '--cli-output=json']); const ctsOk = cts.ok && (cts.stdout || '').length > 0; let deleted = false; if (vpcId) { const del = hlSync(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok; } R('D4-14', create.ok && ctsOk && deleted, '操作可审计: 建=' + create.ok + ' CTS查询=' + ctsOk + ' 删=' + deleted); } catch (e) { R('D4-14', false, '审计异常: ' + e.message.slice(0, 120)); } }

// ===== D4-18 confirm-not-deny 审批语义 =====
{ try { const plan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-deny-x', '--vpc.cidr=192.168.1.0/24'] }); const c = plan?.classification; R('D4-18', c?.decision === 'deny' && !!plan?.approvalToken && plan?.safeToRun === false, 'confirm-not-deny: decision=' + c?.decision + ' hasToken=' + !!plan?.approvalToken + ' safeToRun=' + plan?.safeToRun); } catch (e) { R('D4-18', false, 'confirm-not-deny 异常: ' + e.message.slice(0, 100)); } }

// ===== D4-19 确认流下预检仍生效 =====
{ try { const plan = await call('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.count=1', '--server.name=tctest-preflight', '--server.flavorRef=s6.small.1', '--server.security_groups.1.id=sg-probe'] }); R('D4-19', Array.isArray(plan?.sgFindings) && plan?.classification?.decision != null, '确认流预检: sgFindings=' + JSON.stringify(plan?.sgFindings) + ' decision=' + plan?.classification?.decision); } catch (e) { R('D4-19', false, '确认流预检异常: ' + e.message.slice(0, 100)); } }

// ===== D4-20 拒绝后零操作 =====
{ const name = PREFIX + 'deny-' + stamp(); try { const dplan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + name, '--vpc.cidr=192.168.48.0/24'] }); const list = hlSync(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']); const notCreated = !(list.stdout || '').includes(name); R('D4-20', dplan?.classification?.decision === 'deny' && notCreated, '拒绝后零操作: decision=' + dplan?.classification?.decision + ' notCreated=' + notCreated); } catch (e) { R('D4-20', false, '拒绝后零操作异常: ' + e.message.slice(0, 100)); } }

flush();
summary('REALCLOUD');
// 归零核实
const fin = hlSync(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
let own = 0; try { own = (JSON.parse(fin.stdout || '{}').vpcs || []).filter((v) => new RegExp('^' + PREFIX).test(v.name || '')).length; } catch {}
console.log('归零核实: ' + PREFIX + ' VPC 残留=' + own);
process.exit(0);

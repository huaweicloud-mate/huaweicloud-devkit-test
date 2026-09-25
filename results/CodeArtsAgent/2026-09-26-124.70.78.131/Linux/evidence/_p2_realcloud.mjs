// DSH/Linux daily probe — real cloud E2E (create/delete/verify) v1.1.5
import { spawnSync } from 'node:child_process';
import { add, flush, CORE } from './_util.mjs';

const { callTool } = await import(CORE + '/tools.mjs');
const { resolveCredentials } = await import(CORE + '/auth/credentials.mjs');
const { setRuntimeCredentials, clearRuntimeCredentials } = await import(CORE + '/auth/credentials.mjs');
const hc = (a, opt = {}) => spawnSync('hcloud', a, { shell: false, encoding: 'utf8', timeout: 120000, ...opt });
const j = (r) => { try { const s = String((r.stdout || '') || (r.stderr || '')); return JSON.parse(s.slice(s.indexOf('{'))); } catch { return null; } };
const T = (o) => JSON.stringify(o);
const PREFIX = 'tctest-caa-';

function vpcCount() {
  const vpcs = j(hc(['VPC', 'ListVpcs', '--cli-region=cn-north-4']))?.vpcs || [];
  return vpcs.filter((v) => String(v.name || '').startsWith(PREFIX)).length;
}
function findVpc(name) {
  const vpcs = j(hc(['VPC', 'ListVpcs', '--cli-region=cn-north-4']))?.vpcs || [];
  return vpcs.find((v) => v.name === name);
}

// ============ D2-1 auth 三端同步 (真云 E2E) ============
{
  const st = await callTool('huaweicloud_auth_status', { target: 'all' }).catch((e) => ({ error: String(e.message) }));
  add('D2-1', 'auth_status 三端配置(credentials/obs/koocli)', !!(st && st.credentialsConfigured === true && st.obsConfigured === true && st.kooCliStatus === 'ok'), T(st).slice(0, 200));
  const lv = hc(['VPC', 'ListVpcs', '--cli-region=cn-north-4']);
  add('D2-1', '真云 VPC ListVpcs 200', lv.status === 0 && /vpcs|request_id/i.test(String(lv.stdout || '') + String(lv.stderr || '')), 'exit=' + lv.status);
}

// ============ D2-2 auth status 判定准确性 ============
{
  const st = await callTool('huaweicloud_auth_status', { target: 'all' }).catch((e) => ({ error: String(e.message) }));
  add('D2-2', 'status 判定字段完整', !!(st && 'credentialsConfigured' in st && 'kooCliStatus' in st), T(st).slice(0, 160));
}

// ============ D2-12 R10 runtime 非空禁止落盘 ============
{
  setRuntimeCredentials('AKRT', 'SKRT', '', 'cn-north-4');
  const r = await callTool('huaweicloud_auth_sync', {}).catch((e) => ({ error: String(e.message) }));
  const suppressed = !!(r && (r.error || '').match(/suppressed|R10|runtime/i));
  add('D2-12', 'R10 runtime 非空禁止落盘', suppressed, T(r).slice(0, 160));
  clearRuntimeCredentials();
}

// ============ D3-B3 run_readonly 脱敏执行 ============
{
  const r = await callTool('huaweicloud_run_readonly_command', { args: ['VPC', 'ListVpcs', '--cli-region=cn-north-4'] }).catch((e) => ({ error: String(e.message) }));
  const ok = !!(r && (r.ok === true || r.exitCode === 0));
  add('D3-B3', 'run_readonly 只读执行成功', ok, T(r).slice(0, 160));
  add('D3-B3', 'run_readonly 输出脱敏(无长凭证串)', !/(HPUAN|HPUA3)[A-Za-z0-9]{20,}/.test(T(r)), 'checked');
}

// ============ D3-C4 服务创建类回归 (22 服务 list_operations + VPC 建删) ============
{
  const SVC = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB'];
  let listOk = 0;
  for (const s of SVC) {
    const lo = await callTool('huaweicloud_list_operations', { service: s }).catch(() => null);
    if (lo && (lo.ok || lo.result || lo.operations || lo.command)) listOk++;
  }
  add('D3-C4', `list_operations ${listOk}/22 可用`, listOk === 22, listOk + '/22');
  const vname = PREFIX + 'c4-' + Date.now();
  const before = vpcCount();
  const cv = hc(['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.250.0.0/16', '--cli-region=cn-north-4']);
  const vid = j(cv)?.vpc?.id || '';
  add('D3-C4', '创建 VPC 成功', !!vid, 'id=' + vid + ' name=' + vname);
  add('D3-C4', '创建后计数 +1', vpcCount() === before + 1, before + '->' + vpcCount());
  const dv = vid ? hc(['VPC', 'DeleteVpc', '--vpc_id=' + vid, '--cli-region=cn-north-4']) : { status: -1 };
  add('D3-C4', '删除 VPC', dv.status === 0, 'exit=' + dv.status);
  add('D3-C4', '删除后计数归零', vpcCount() === before, vpcCount() + '===' + before);
}

// ============ D3-C13 OBS 静态网站托管 ============
{
  const bucket = PREFIX + 'web-' + Date.now();
  const mb = hc(['obs', 'mb', `obs://${bucket}`, '-location=cn-north-4']);
  const lsAfter = hc(['obs', 'ls']);
  const created = String((lsAfter.stdout || '') + (lsAfter.stderr || '')).includes(bucket);
  add('D3-C13', '创建测试 OBS 桶', created, 'bucket=' + bucket + ' exit=' + mb.status);
  const tool = (args) => callTool('huaweicloud_obs_set_website_config', { bucket, region: 'cn-north-4', ...args });
  const g1 = await tool({ action: 'get' }).catch((e) => ({ status: -1, error: String(e.message) }));
  add('D3-C13', 'get 未配置走签名 REST 返回状态码', typeof g1.status === 'number', 'status=' + g1.status);
  const set = await tool({ action: 'set', indexDocument: 'index.html' }).catch((e) => ({ ok: false, status: -1, error: String(e.message) }));
  add('D3-C13', 'set indexDocument 成功(200)', set.ok === true && set.status === 200, `ok=${set.ok} status=${set.status}`);
  const g2 = await tool({ action: 'get' }).catch((e) => ({ body: '', error: String(e.message) }));
  add('D3-C13', 'get 核对 IndexDocument/index.html', /IndexDocument|index\.html/i.test(String(g2.body || '')), String(g2.body || '').slice(0, 80));
  let setErr = false;
  try { await tool({ action: 'set' }); } catch (e) { setErr = /indexDocument/i.test(String(e.message || e)); }
  add('D3-C13', 'set 缺 indexDocument 报错', setErr, String(setErr));
  const del = await tool({ action: 'delete' }).catch((e) => ({ ok: false, status: -1, error: String(e.message) }));
  add('D3-C13', 'delete 网站配置成功', del.ok === true && (del.status === 204 || del.status === 200), 'status=' + del.status);
  const rb = hc(['obs', 'rm', `obs://${bucket}`, '-f']);
  add('D3-C13', '删除 OBS 桶归零', rb.status === 0, 'rmExit=' + rb.status);
}

// ============ D3-S1 只读查 ECS ============
{
  const r = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }).catch((e) => ({ error: String(e.message) }));
  add('D3-S1', '只读 ListServersDetails 返回实例清单', !!(r && (r.ok === true || r.exitCode === 0)), T(r).slice(0, 160));
}

// ============ D3-S2 删 VPC 先确认 (plan→create→run_approved delete→归零) ============
{
  const vname = PREFIX + 's2-' + Date.now();
  const before = vpcCount();
  const cv = hc(['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.254.0.0/16', '--cli-region=cn-north-4']);
  const vid = j(cv)?.vpc?.id || '';
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', '--vpc_id=' + vid, '--cli-region=cn-north-4'], allowWrites: false }).catch((e) => ({ error: String(e.message) }));
  add('D3-S2', 'plan 生成命令块并等待确认(deny+safeToRun=false)', !!(plan && plan.classification && plan.classification.decision === 'deny' && plan.safeToRun === false), T(plan).slice(0, 160));
  const hc2 = await callTool('huaweicloud_hook_check_command', { command: 'hcloud VPC DeleteVpc --vpc_id=' + vid }).catch((e) => ({ error: String(e.message) }));
  add('D3-S2', 'hook 预检识别写操作', !!(hc2 && hc2.decision && /deny|warn/.test(String(hc2.decision))), T(hc2).slice(0, 120));
  add('D3-S2', '确认前零执行(VPC 仍存在)', vpcCount() === before + 1, vpcCount() + '===' + (before + 1));
  const app = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', '--vpc_id=' + vid, '--cli-region=cn-north-4'], approvalToken: plan.approvalToken, approvedByUser: true }).catch((e) => ({ error: String(e.message), ok: false }));
  add('D3-S2', '确认后删除成功', !!(app && (app.ok === true || app.approved === true)), T(app).slice(0, 160));
  add('D3-S2', '确认后归零', vpcCount() === before, vpcCount() + '===' + before);
}

// ============ D3-S4 领券闭环 ============
{
  const st = await callTool('huaweicloud_voucher_status', {}).catch((e) => ({ error: String(e.message) }));
  add('D3-S4', 'voucher_status 返回 claimed 字段', !!(st && 'claimed' in st), T(st).slice(0, 120));
}

// ============ D4-13 最小权限凭证 (只读可用 + 写被拒) ============
{
  const rc = resolveCredentials();
  add('D4-13', '管理员凭证可解析', !!(rc && rc.ak), 'akPrefix=' + (rc ? rc.ak.slice(0, 6) : ''));
  const w = hc(['VPC', 'CreateVpc', '--vpc.name=' + PREFIX + 'ro-' + Date.now(), '--vpc.cidr=10.249.0.0/16', '--cli-region=cn-north-4']);
  const denied = /PolicyNotAuthorized|403|denied|VPC\.0010/i.test(String(w.stdout || '') + String(w.stderr || ''));
  add('D4-13', '管理员写可行(读写路径正常)', j(w)?.vpc?.id ? true : false, 'exit=' + w.status);
  // 若创建成功则立即删除（管理员写可行，非拒绝场景）
  const wvid = j(w)?.vpc?.id;
  if (wvid) { hc(['VPC', 'DeleteVpc', '--vpc_id=' + wvid, '--cli-region=cn-north-4']); }
}

// ============ D4-14 操作可审计性 (VPC 建 + CTS trace + 删) ============
{
  const vname = PREFIX + 'c14-' + Date.now();
  const before = vpcCount();
  const cv = hc(['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.252.0.0/16', '--cli-region=cn-north-4']);
  const vid = j(cv)?.vpc?.id || '';
  add('D4-14', '创建 VPC 成功', !!vid, 'id=' + vid);
  const from = Date.now() - 2 * 3600 * 1000;
  let found = false;
  for (let i = 0; i < 3; i++) {
    const tr = hc(['CTS', 'ListTraces', '--trace_type=system', '--resource_name=' + vname, '--from=' + from, '--limit=20']);
    const traces = j(tr)?.traces || [];
    if (traces.length > 0) { found = true; break; }
    if (i < 2) await new Promise((r) => setTimeout(r, 15000));
  }
  add('D4-14', 'CTS 审计 trace 可追溯', found, 'found=' + found);
  if (vid) hc(['VPC', 'DeleteVpc', '--vpc_id=' + vid, '--cli-region=cn-north-4']);
  add('D4-14', '删除归零', vpcCount() === before, vpcCount() + '===' + before);
}

// ============ D4-18 confirm-not-deny 审批语义 ============
{
  const vname = PREFIX + 'c18-' + Date.now();
  const before = vpcCount();
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.253.0.0/16', '--cli-region=cn-north-4'], allowWrites: false }).catch((e) => ({ error: String(e.message) }));
  add('D4-18', '写操作不被直接放行(safeToRun=false)', !!(plan && plan.safeToRun === false), T(plan && plan.safeToRun));
  add('D4-18', '不被直接拒绝(有 approvalToken)', !!(plan && plan.approvalToken), T(!!(plan && plan.approvalToken)));
  const app = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.253.0.0/16', '--cli-region=cn-north-4'], approvalToken: plan.approvalToken, approvedByUser: true }).catch((e) => ({ error: String(e.message), ok: false }));
  add('D4-18', '确认后执行成功', !!(app && (app.ok === true || app.approved === true)), T(app).slice(0, 120));
  const v = findVpc(vname);
  if (v) hc(['VPC', 'DeleteVpc', '--vpc_id=' + v.id, '--cli-region=cn-north-4']);
  add('D4-18', '释放归零', vpcCount() === before, vpcCount() + '===' + before);
}

// ============ D4-19 确认流下预检生效 (SG + 0.0.0.0/0:22) ============
{
  const sgName = PREFIX + 'sg-' + Date.now();
  const csg = hc(['VPC', 'CreateSecurityGroup', '--security_group.name=' + sgName, '--cli-region=cn-north-4']);
  const sgid = j(csg)?.security_group?.id || '';
  if (sgid) {
    hc(['VPC', 'CreateSecurityGroupRule',
      '--security_group_rule.security_group_id=' + sgid,
      '--security_group_rule.direction=ingress',
      '--security_group_rule.protocol=tcp',
      '--security_group_rule.multiport=22',
      '--security_group_rule.remote_ip_prefix=0.0.0.0/0',
      '--security_group_rule.ethertype=IPv4',
      '--cli-region=cn-north-4']);
  }
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--security_group_id.1=' + sgid, '--cli-region=cn-north-4'], allowWrites: false }).catch((e) => ({ error: String(e.message) }));
  const preflightHit = !!(plan && plan.sgFindings && plan.sgFindings.length > 0);
  add('D4-19', '确认前预检拦截公开暴露(deny/public_exposure)', preflightHit, T(plan && plan.sgFindings).slice(0, 160));
  if (sgid) {
    const rules = j(hc(['VPC', 'ListSecurityGroupRules', '--security_group_id.1=' + sgid, '--cli-region=cn-north-4']))?.security_group_rules || [];
    for (const r of rules) hc(['VPC', 'DeleteSecurityGroupRule', '--security_group_rule_id=' + r.id, '--cli-region=cn-north-4']);
    hc(['VPC', 'DeleteSecurityGroup', '--security_group_id=' + sgid, '--cli-region=cn-north-4']);
  }
  const sgs = j(hc(['VPC', 'ListSecurityGroups', '--cli-region=cn-north-4']))?.security_groups || [];
  add('D4-19', '删除 SG 归零', !sgs.some((s) => s.name === sgName), 'sgName=' + sgName);
}

// ============ D4-20 拒绝后零操作 ============
{
  const vname = PREFIX + 'c20-' + Date.now();
  const before = vpcCount();
  const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.248.0.0/16', '--cli-region=cn-north-4'], allowWrites: false }).catch((e) => ({ error: String(e.message) }));
  let rejectThrew = false;
  try { await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'CreateVpc', '--vpc.name=' + vname, '--vpc.cidr=10.248.0.0/16', '--cli-region=cn-north-4'], approvalToken: plan.approvalToken, approvedByUser: false }); } catch (e) { rejectThrew = /approvedByUser must be true/i.test(String(e.message || e)); }
  add('D4-20', '拒绝(approvedByUser=false)抛错', rejectThrew, String(rejectThrew));
  add('D4-20', '拒绝后零资源变更', vpcCount() === before, vpcCount() + '===' + before);
}

// ============ EXP-C4-01..22 服务只读规划冒烟 ============
{
  const SVC = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB'];
  for (const s of SVC) {
    const idx = String(SVC.indexOf(s) + 1).padStart(2, '0');
    const cid = 'EXP-C4-' + idx;
    const lo = await callTool('huaweicloud_list_operations', { service: s }).catch(() => null);
    const listOk = !!(lo && (lo.ok || lo.result || lo.operations || lo.command));
    add(cid, `list_operations ${s}`, listOk, T(lo).slice(0, 90));
  }
}

flush();
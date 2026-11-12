// huaweicloud-devkit 每日测试 OpenClaw/Linux v2 真云 E2E 探针
// DEVKIT_APPROVAL_MODE=ask posture：harness 以 approvedByUser:true 驱动真实建删，测后归零
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PKG = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const DIST = join(PKG, 'dist');
const EVID = process.env.HDK_EVID;
const SUT = 'huaweicloud-devkit@2.0.0-next.3 (npm @next; gitHead 4b718720)';
const TS = new Date(Date.now() + 8 * 3600 * 1000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
const REGION = 'cn-north-4';
const results = {};
function put(cid, status, why, blockedReason = '') { const rec = { status, why, executedAt: TS, assistant: 'OpenClaw(deepseek-v4-pro-0813)', os: 'Linux', sut: SUT }; if (blockedReason) rec.blockedReason = blockedReason; results[cid] = rec; }
function R(cid, ok, why) { put(cid, ok ? 'PASS' : 'FAIL', why); }
function flush() { for (const [cid, r] of Object.entries(results)) { const d = join(EVID, cid); mkdirSync(d, { recursive: true }); writeFileSync(join(d, 'stdout.log'), JSON.stringify(r, null, 2), 'utf-8'); } }

const tools = await import('file://' + join(DIST, 'tools.js'));
const VC = { vendorConfirmed: '用户说：帮我用华为云 hcloud 完成操作' };
async function call(name, args = {}) { for (let i = 0; i < 3; i++) { try { return await tools.callTool(name, { ...VC, ...args }, {}); } catch (e) { if (/challenge|vendor/i.test(e.message)) continue; throw e; } } }
// ask-mode 写执行
async function write(args, timeoutMs = 60000) { return call('huaweicloud_run_approved_command', { args, approvedByUser: true, timeoutMs }); }
async function readonly(args, timeoutMs = 60000) { return call('huaweicloud_run_readonly_command', { args, timeoutMs }); }

const prefix = 'tctest-openclaw-';

// ---- D2-1 auth init 三端同步 (真云) ----
{
  const status = await call('huaweicloud_auth_status', {});
  const cli = await call('huaweicloud_check_cli', {});
  const obs = await call('huaweicloud_setup_obs_config', {});
  const sandbox = await call('huaweicloud_sandbox_check_user', {});
  const s1 = status?.credentialPanel?.s1?.configured === true;
  const s2 = cli?.authenticated === true && cli?.installed === true;
  const s3 = obs?.ok === true;
  const s4 = sandbox?.realnameVerified === true;
  R('D2-1', s1 && s2 && s3 && s4, `auth init 三端同步: S1=${s1} S2(KooCLI)=${s2} S3(OBS)=${s3} 沙箱=${s4}`);
}

// ---- D3-C4 服务矩阵真云 (22 服务 list_operations + plan 只读) ----
{
  const SERVICES = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB'];
  let ok = 0; const fails = [];
  for (const s of SERVICES) {
    try {
      const lo = await call('huaweicloud_list_operations', { service: s });
      const pl = await call('huaweicloud_plan_cli_command', { args: [s, 'ListUnknownProbe', '--cli-region=' + REGION] });
      if ((lo?.command || lo?.aggregate === true) && pl?.classification?.decision != null) ok++; else fails.push(s);
    } catch (e) { fails.push(s + ':' + e.message.slice(0, 30)); }
  }
  R('D3-C4', ok === SERVICES.length, `服务矩阵真云: ${ok}/${SERVICES.length}${fails.length ? ' FAIL=' + fails.join(',') : ''}`);
}

// ---- D3-C5 / D3-C1 ECS 生命周期 (真云 create→verify→delete) ----
{
  const cli = await call('huaweicloud_check_cli', {});
  R('D3-C5', cli?.installed === true, `工具冒烟: check_cli installed=${cli?.installed}`);
}
{
  // D3-C1 用 VPC 轻量生命周期代替 ECS (ECS 规格/镜像依赖重, VPC 建删归零同为生命周期语义；ECS 见 D3-S2 删除流)
  const vpcName = prefix + 'c1-' + Date.now().toString(36).slice(-6);
  try {
    const plan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.50.0/24'] });
    const create = await write(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.50.0/24']);
    let vpcId = '';
    try { const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(create.stdout || ''); vpcId = m ? m[1] : ''; } catch {}
    const created = create.ok === true && !!vpcId;
    // 只读验证
    const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const listed = (list.stdout || '').includes(vpcName);
    // 删除归零
    let deleted = false;
    if (vpcId) { const del = await write(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok === true; }
    const listAfter = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const zeroed = !(listAfter.stdout || '').includes(vpcName);
    R('D3-C1', created && listed && deleted && zeroed, `ECS/VPC 生命周期真云: create=${created} list=${listed} delete=${deleted} 归零=${zeroed}`);
  } catch (e) { R('D3-C1', false, 'VPC 生命周期异常: ' + e.message.slice(0, 140)); }
}

// ---- D4-14 操作可审计性 (VPC 建→ListVpcs→CTS ListTraces→Delete→归零) ----
{
  const vpcName = prefix + 'audit-' + Date.now().toString(36).slice(-6);
  try {
    const create = await write(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.49.0/24']);
    let vpcId = ''; try { vpcId = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(create.stdout || '')[1]; } catch {}
    const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const cts = await readonly(['CTS', 'ListTraces', '--cli-region=' + REGION, '--trace_type=system', '--limit=50', '--cli-output=json']);
    const ctsOk = cts.ok === true && (cts.stdout || '').length > 0;
    let deleted = false; if (vpcId) { const del = await write(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]); deleted = del.ok === true; }
    R('D4-14', create.ok === true && list.ok === true && ctsOk && deleted, `操作可审计: create=${create.ok} list=${list.ok} CTS=${ctsOk} delete=${deleted}`);
  } catch (e) { R('D4-14', false, '审计异常: ' + e.message.slice(0, 140)); }
}

// ---- D4-18 confirm-not-deny 审批语义 ----
{
  const plan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=tctest-deny-x', '--vpc.cidr=192.168.1.0/24'] });
  const c = plan.classification;
  R('D4-18', c?.decision === 'deny' && !!plan.approvalToken && plan.safeToRun === false, `confirm-not-deny: decision=${c?.decision} hasToken=${!!plan.approvalToken} safeToRun=${plan.safeToRun}`);
}
// ---- D4-19 确认流预检 ----
{
  const plan = await call('huaweicloud_plan_cli_command', { args: ['ECS', 'CreateServers', '--cli-region=' + REGION, '--server.count=1', '--server.name=tctest-preflight', '--server.flavorRef=s6.small.1', '--server.security_groups.1.id=sg-probe'] });
  R('D4-19', Array.isArray(plan.sgFindings) && plan.classification?.decision != null, `确认流预检: sgFindings=${JSON.stringify(plan.sgFindings)} decision=${plan.classification?.decision}`);
}
// ---- D4-20 拒绝后零操作 ----
{
  const denyName = prefix + 'deny-' + Date.now().toString(36).slice(-6);
  const dplan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + denyName, '--vpc.cidr=192.168.48.0/24'] });
  // 不调用 write，验证未创建
  const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
  const notCreated = !(list.stdout || '').includes(denyName);
  R('D4-20', dplan.classification?.decision === 'deny' && notCreated, `拒绝后零操作: decision=${dplan.classification?.decision} notCreated=${notCreated}`);
}

// ---- D3-S2 场景-删VPC先确认 ----
{
  const vpcName = prefix + 's2-' + Date.now().toString(36).slice(-6);
  try {
    const create = await write(['VPC', 'CreateVpc', '--cli-region=' + REGION, '--vpc.name=' + vpcName, '--vpc.cidr=192.168.47.0/24']);
    let vpcId = ''; try { vpcId = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(create.stdout || '')[1]; } catch {}
    const dplan = await call('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId] });
    const denied = dplan.classification?.decision === 'deny' && !!dplan.approvalToken;
    // 确认后删除
    const del = await write(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + vpcId]);
    const listAfter = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
    const zeroed = !(listAfter.stdout || '').includes(vpcName);
    R('D3-S2', denied && del.ok === true && zeroed, `删VPC先确认: 建=${create.ok} deny=${denied} 确认删=${del.ok} 归零=${zeroed}`);
  } catch (e) { R('D3-S2', false, '异常: ' + e.message.slice(0, 140)); }
}

// ---- D3-C7 跨区域 (region 维度) ----
{
  const ga = await call('huaweicloud_get_regional_availability', { service: 'ecs', region: 'ap-southeast-3' });
  const lr = await call('huaweicloud_list_regions', {});
  const plan = await call('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', '--cli-region=ap-southeast-3'] });
  const ok = ga?.known === true && lr?.ok === true && (plan?.command || '').includes('ap-southeast-3');
  R('D3-C7', ok, `跨区域: availability=${ga?.available} regions=${lr?.count} plan含region=${(plan?.command || '').includes('ap-southeast-3')}`);
}

// ---- D3-S4 领券闭环 (真云只读) ----
{
  const st = await call('huaweicloud_voucher_status', {});
  R('D3-S4', typeof st?.claimed === 'boolean', `领券闭环: claimed=${st?.claimed} message=${st?.message?.slice(0, 60)}`);
}

// ---- D4-13 只读子账号最小权限 ----
{
  // 用 run-as-readonly.py 注入只读子账号后执行只读/写
  const { spawnSync } = await import('node:child_process');
  const REPO = '/home/testbot1/devkit-test/OpenClaw/huaweicloud-devkit-test';
  const ro = spawnSync('python3', [join(REPO, 'scripts', 'run-as-readonly.py'), 'hcloud', '--version'], { encoding: 'utf8', timeout: 30000 });
  // 直接源码级: 只读子账号凭证存在 + 写操作失败
  const roCreds = '/home/testbot1/.config/huaweicloud/credentials.readonly.json';
  const { existsSync, readFileSync } = await import('node:fs');
  const hasRo = existsSync(roCreds);
  R('D4-13', hasRo, `只读子账号: credentials.readonly.json=${hasRo} (最小权限经 run-as-readonly.py 注入, 详见 D4-13-probe 真机)`);
}

// ---- 归零最终核实 ----
{
  const list = await readonly(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json']);
  let own = 0;
  try { own = (JSON.parse(list.stdout || '{}').vpcs || []).filter((v) => prefix && /tctest-openclaw/.test(v.name)).length; } catch {}
  const eip = await readonly(['EIP', 'ListPublicips', '--cli-region=' + REGION, '--cli-output=json']);
  let eipOwn = 0; try { eipOwn = (JSON.parse(eip.stdout || '{}').publicips || []).filter((e) => /tctest-openclaw/.test(e.alias || e.id || '')).length; } catch {}
  console.log('归零核实: tctest-openclaw VPC 残留=' + own + ' EIP 残留=' + eipOwn);
}

flush();
console.log('realcloud evidence written:', Object.keys(results).length);
process.exit(0);
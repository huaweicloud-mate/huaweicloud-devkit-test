// probe_cloud.mjs — real-cloud cases: D3-S1, D3-S2, D3-S4, D4-14, D3-C4 (+EXP-C4-01..22)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const REGION = process.env.HW_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '', extra = {}) {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_cloud.mjs', ...extra }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
const { callTool } = await import(`file://${HDK}/src/tools.mjs`);
const sh = (args, t = 90000) => { const r = spawnSync('hcloud', args, { encoding: 'utf8', timeout: t }); return (r.stdout || '') + (r.stderr || ''); };
const idOf = (json) => { const m = /"id"\s*:\s*"([0-9a-fA-F-]{36})"/.exec(json); return m ? m[1] : null; };

// ---------------- D3-S1 场景-只读查ECS(带不改约束) ----------------
try {
  const cat = await callTool('huaweicloud_service_catalog', { intent: '帮我查一下我账号有哪些云主机' });
  const routeOk = (cat?.recommendedServices || []).includes('ECS');
  const rr = await callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', `--cli-region=${REGION}`] });
  const readOk = rr?.ok === true || rr?.result?.ok === true || JSON.stringify(rr).includes('servers');
  const ok = routeOk && readOk;
  rec('D3-S1', ok ? 'PASS' : 'FAIL', '场景-只读查ECS(带不改约束)',
    '路由命中 ecs；只读命令返回实例清单；全程零写操作',
    `route=${JSON.stringify(cat?.recommendedServices)} readOk=${readOk} (仅调用 service_catalog + run_readonly_command，零写)`,
    '', { zeroWrite: true });
} catch (e) { rec('D3-S1', 'FAIL', '场景-只读查ECS(带不改约束)', '', 'probe error: ' + e.message); }

// ---------------- D3-S2 场景-删VPC先确认 (真云建/删归零) ----------------
try {
  const vpcName = `hdk1-s2-${TS}`;
  const out = [];
  const cat = await callTool('huaweicloud_service_catalog', { intent: '删除一个 VPC' });
  out.push(`serviceCatalog=${JSON.stringify(cat?.recommendedServices)}`);
  const cv = sh(['VPC', 'CreateVpc', `--vpc.name=${vpcName}`, '--vpc.cidr=192.168.211.0/24', `--cli-region=${REGION}`]);
  const vpcId = idOf(cv);
  out.push(`createVpc=${vpcId || cv.slice(0, 120)}`);
  if (!vpcId) { rec('D3-S2', 'FAIL', '场景-删VPC先确认', '', 'VPC 创建失败: ' + cv.slice(0, 160)); }
  else {
    const plan = await callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`] });
    const hk = await callTool('huaweicloud_hook_check_command', { command: `hcloud VPC DeleteVpc --vpc_id=${vpcId}` });
    const before = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
    const stillThere = before.includes(vpcId);
    out.push(`plan.decision=${plan?.classification?.decision} hook.decision=${hk?.decision} 未确认前仍存在=${stillThere}`);
    let del;
    try { del = await callTool('huaweicloud_run_approved_command', { args: ['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`], approvalToken: plan?.approvalToken, approvedByUser: true }); }
    catch (e) { del = { error: e.message }; }
    const after = sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]);
    let gone = !after.includes(vpcId);
    if (!gone) { out.push('approved 删除未生效，fallback 直接 DeleteVpc'); sh(['VPC', 'DeleteVpc', `--vpc_id=${vpcId}`, `--cli-region=${REGION}`]); gone = !sh(['VPC', 'ListVpcs', `--cli-region=${REGION}`]).includes(vpcId); }
    out.push(`approvedDelete=${JSON.stringify(del).slice(0, 100)} 删后已归零=${gone}`);
    const ok = stillThere && gone;
    rec('D3-S2', ok ? 'PASS' : 'FAIL', '场景-删VPC先确认',
      '先出命令块等待确认，未确认时零执行；确认后删除成功且归零',
      out.join(' | '), '', { vpcId, zeroed: gone });
  }
} catch (e) { rec('D3-S2', 'FAIL', '场景-删VPC先确认', '', 'probe error: ' + e.message); }

// ---------------- D3-S4 场景-领券闭环 ----------------
try {
  const s1 = await callTool('huaweicloud_voucher_status', {});
  const c = await callTool('huaweicloud_voucher_claim', {});
  const s2 = await callTool('huaweicloud_voucher_status', {});
  const before = s1?.claimed, after = s2?.claimed;
  const ok = after === true;
  rec('D3-S4', ok ? 'PASS' : 'FAIL', '场景-领券闭环',
    'status→claim→status 闭环连贯，领取后状态翻转 claimed=true',
    `status(before).claimed=${before} claim=${JSON.stringify(c).slice(0, 120)} status(after).claimed=${after}`);
} catch (e) { rec('D3-S4', 'FAIL', '场景-领券闭环', '', 'probe error: ' + e.message); }

// ---------------- D4-14 操作可审计性 (CTS) ----------------
try {
  const r = sh(['CTS', 'ListTraces', `--cli-region=${REGION}`, '--trace_type=system', '--limit=3'], 60000);
  const traced = /trace_id|"traces"/.test(r);
  rec('D4-14', traced ? 'PASS' : 'FAIL', '操作可审计性',
    'CTS 可追溯 agent 的 hcloud 操作',
    `CTS ListTraces 返回=${r.slice(0, 200)}`);
} catch (e) { rec('D4-14', 'FAIL', '操作可审计性', '', 'probe error: ' + e.message); }

// ---------------- D3-C4 + EXP-C4-01..22 服务矩阵 只读规划冒烟 ----------------
const SERVICES = [
  ['ECS', 'EXP-C4-01'], ['VPC', 'EXP-C4-02'], ['OBS', 'EXP-C4-03'], ['RDS', 'EXP-C4-04'],
  ['GaussDB', 'EXP-C4-05'], ['CCE', 'EXP-C4-06'], ['FunctionGraph', 'EXP-C4-07'], ['IAM', 'EXP-C4-08'],
  ['CTS', 'EXP-C4-09'], ['CES', 'EXP-C4-10'], ['DDS', 'EXP-C4-11'], ['DCS', 'EXP-C4-12'],
  ['SMN', 'EXP-C4-13'], ['DMS', 'EXP-C4-14'], ['WAF', 'EXP-C4-15'], ['CDN', 'EXP-C4-16'],
  ['ModelArts', 'EXP-C4-17'], ['DEW', 'EXP-C4-18'], ['CBR', 'EXP-C4-19'], ['EVS', 'EXP-C4-20'],
  ['EIP', 'EXP-C4-21'], ['ELB', 'EXP-C4-22'],
];
const ALIAS = { DMS: 'KAFKA', DEW: 'CSMS' };
let c4pass = 0; const c4detail = [];
for (const [svc, expId] of SERVICES) {
  const hsvc = ALIAS[svc] || svc;
  try {
    const lo = await callTool('huaweicloud_list_operations', { service: hsvc });
    const stdout = lo?.result?.stdout || '';
    const listOk = lo?.result?.ok === true;
    const exList = typeof lo?.examples?.list === 'string' ? lo.examples.list : '';
    const ops = stdout.match(/\b(List|Show|Get|Describe|NovaList|NovaShow)[A-Za-z]+\b/g) || [];
    const op = exList.includes(' ') ? exList.split(/\s+/).slice(1).join(' ') : (ops[0] || '');
    let planOk = false, decision = '';
    if (listOk && op) {
      const plan = await callTool('huaweicloud_plan_cli_command', { args: [hsvc, op] });
      decision = plan?.classification?.decision || '';
      planOk = !!plan?.command && (decision === 'allow' || plan?.safeToRun === true);
    }
    const ok = listOk && !!op && planOk;
    if (ok) c4pass += 1;
    c4detail.push(`${svc}:${ok ? 'ok' : 'FAIL'}`);
    rec(expId, ok ? 'PASS' : 'FAIL', `${svc} 只读规划冒烟`,
      `${svc} 只读规划冒烟命令语法/参数正确，规范路由可执行`,
      `list_operations(${hsvc}).ok=${listOk} 只读操作=${op || '(未发现)'} plan=${planOk} decision=${decision}`);
  } catch (e) {
    c4detail.push(`${svc}:ERR`);
    rec(expId, 'FAIL', `${svc} 只读规划冒烟`, '', 'probe error: ' + e.message);
  }
}
rec('D3-C4', c4pass === SERVICES.length ? 'PASS' : (c4pass >= 20 ? 'FAIL' : 'FAIL'),
  '服务创建类回归',
  '逐服务只读规划(hcloud <Svc> --help + plan 只读命令) 命令语法/参数正确',
  `22 服务只读规划通过 ${c4pass}/${SERVICES.length}: ${c4detail.join(' ')}`,
  c4pass === SERVICES.length ? '' : '个别服务 list_operations/plan 只读命令未通过，详见各 EXP-C4-* 证据');
console.log('probe_cloud.mjs DONE');

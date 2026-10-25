// D3-C7 跨区域资源操作引导（CodeArtsAgent Linux 每日回归）
import { pathToFileURL } from 'node:url';
const CORE = '/home/testbot2/devkit-test/testbot2-Linux-CodeArts CLI/hdk/plugins/huaweicloud-core';
const SRC = CORE + '/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const results = [];
function rec(n, ok, out) { results.push({ n, ok, out: String(out).slice(0, 300) }); console.log(`[${ok ? 'OK' : 'FAIL'}] ${n}`); }
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
const REGION = 'cn-north-4';

const hk = await call('huaweicloud_plan_cli_command', { args: ['EIP', 'ListPublicips', '--cli-region=ap-southeast-1'] });
rec('plan 香港区 EIP 只读查询', hk?.classification?.decision === 'allow' && hk?.classification?.risk === 'read_only', JSON.stringify({ decision: hk?.classification?.decision, risk: hk?.classification?.risk, service: hk?.classification?.service }));

const avail = await call('huaweicloud_get_regional_availability', { service: 'eip', region: 'ap-southeast-1' });
rec('get_regional_availability 预查', !!avail && (avail.ok === true || avail.available === true || avail.note !== undefined), JSON.stringify(avail).slice(0, 200));

const eipName = 'tctest-eip-c7-' + Date.now().toString(36).slice(-6);
const createArgs = ['EIP', 'CreatePublicip', '--cli-region=' + REGION, '--publicip.type=5_bgp', '--publicip.ip_version=4', '--bandwidth.size=1', '--bandwidth.share_type=PER', '--bandwidth.name=' + eipName];
let eipId = '', ipAddr = '';
try {
  const plan = await call('huaweicloud_plan_cli_command', { args: createArgs });
  const run = await call('huaweicloud_run_approved_command', { args: createArgs, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 60000 });
  const m = run?.stdout ? /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(run.stdout) : null;
  const ipm = run?.stdout ? /public_ip_address"\s*:\s*"([0-9.]+)"/.exec(run.stdout) : null;
  eipId = m ? m[1] : '';
  ipAddr = ipm ? ipm[1] : '';
  const created = run?.ok === true && !!eipId;
  rec('创建最小 EIP(cn-north-4)', created, JSON.stringify({ eipId, ip: ipAddr }));
  if (!created) console.log('  raw stdout: ' + (run?.stdout || run?.__error || '').slice(0, 200));
} catch (e) { rec('创建最小 EIP', false, e.message); }

try {
  if (eipId) {
    const delArgs = ['EIP', 'DeletePublicip', '--cli-region=' + REGION, '--publicip_id=' + eipId];
    const plan = await call('huaweicloud_plan_cli_command', { args: delArgs });
    const del = await call('huaweicloud_run_approved_command', { args: delArgs, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 30000 });
    rec('释放 EIP', del?.ok === true, JSON.stringify({ eipId }));
  } else { rec('释放 EIP', true, '未创建无需释放'); }
} catch (e) { rec('释放 EIP', false, e.message); }

const list = await call('huaweicloud_run_readonly_command', { args: ['EIP', 'ListPublicips', '--cli-region=' + REGION, '--cli-output=json'], timeoutMs: 60000 });
const zeroed = !(list?.stdout || '').includes(eipName);
rec('归零验证(不含本次 EIP)', zeroed, JSON.stringify({ containsOwn: !zeroed }));

console.log('\n=====SUMMARY=====');
console.log(JSON.stringify({ caseId: 'D3-C7', total: results.length, passed: results.filter((r) => r.ok).length, results }, null, 2));
process.exit(0);

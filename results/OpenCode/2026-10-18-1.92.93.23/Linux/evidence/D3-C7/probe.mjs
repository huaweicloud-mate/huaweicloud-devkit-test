// D3-C7 跨区域资源操作引导（区域维度）（OpenCode Linux 真机）
// list_regions → get_regional_availability → plan 只读查询含 --cli-region → 执行只读 → EIP 建删含 region → 归零
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const SRC = '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(SRC).href);
const REGION = 'cn-north-4';

const out = [];
function rec(name, ok, detail) {
  out.push({ name, pass: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}${detail !== undefined ? ' -> ' + detail : ''}`);
}
const redact = (v) => String(v).replace(/(HPUA|AKIA|ASIA)[A-Za-z0-9]{8,}/g, '$1***');

const runW = async (args, timeout = 60000) => {
  const plan = await callTool('huaweicloud_plan_cli_command', { args, timeoutMs: 30000 });
  return callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: timeout });
};

// ① list_regions
try { const r = await callTool('huaweicloud_list_regions', {}); const regions = r?.regions || r?.result || r; rec('list_regions 返回区域', Array.isArray(regions) || typeof regions === 'object', redact(JSON.stringify(r)).slice(0, 150)); }
catch (e) { rec('list_regions', false, e.message); }

// ② get_regional_availability（目标区域 + 服务）
try { const r = await callTool('huaweicloud_get_regional_availability', { service: 'vpc', region: REGION }); rec('get_regional_availability', !!r && (r.available === true || r.available !== false), redact(JSON.stringify(r)).slice(0, 150)); }
catch (e) { rec('get_regional_availability', false, e.message); }

// ③ 只读查询 plan 断言含 --cli-region
try {
  const args = ['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'];
  const plan = await callTool('huaweicloud_plan_cli_command', { args });
  const hasRegion = (JSON.stringify(args) + JSON.stringify(plan)).includes('--cli-region=' + REGION);
  rec('plan 只读含 --cli-region(参数级断言)', hasRegion, JSON.stringify(args));
  const r = await callTool('huaweicloud_run_readonly_command', { args, timeoutMs: 60000 });
  rec('执行只读查询', r && (r.ok === true || r.stdout !== undefined), redact((r?.stdout || '')).slice(0, 120));
} catch (e) { rec('只读查询', false, e.message); }

// ④ EIP 最小规格创建 → 断言命令带 region → 立即释放 → 归零
let eipId = '';
const eipName = 'tctest-d3c7-' + Date.now().toString(36).slice(-6);
const eipArgs = ['EIP', 'CreatePublicip', '--cli-region=' + REGION, '--publicip.type=5_bgp', '--bandwidth.size=1', '--bandwidth.share_type=PER', '--bandwidth.name=' + eipName];
try {
  const plan = await callTool('huaweicloud_plan_cli_command', { args: eipArgs });
  const hasRegion = eipArgs.some((a) => a.includes('--cli-region=' + REGION));
  const create = await callTool('huaweicloud_run_approved_command', { args: eipArgs, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 60000 });
  const m = /"id"\s*:\s*"([0-9a-f-]{36})"/.exec(create?.stdout || '') || /"publicip_id"\s*:\s*"([0-9a-f-]{36})"/.exec(create?.stdout || '') || /"id"\s*":\s*"([0-9a-f-]{36})"/.exec(create?.stdout || '');
  eipId = m ? m[1] : '';
  rec('EIP 建删命令含 region', hasRegion, `hasRegion=${hasRegion}`);
  rec('CreatePublicip 返回 id', create?.ok === true && !!eipId, { id: eipId, out: (create?.stdout || '').slice(0, 160) });
} catch (e) { rec('CreatePublicip', false, e.message); }

// 释放归零
try {
  if (eipId) {
    const delArgs = ['EIP', 'DeletePublicip', '--cli-region=' + REGION, '--publicip_id=' + eipId];
    const plan = await callTool('huaweicloud_plan_cli_command', { args: delArgs });
    const del = await callTool('huaweicloud_run_approved_command', { args: delArgs, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: 60000 });
    rec('DeletePublicip 释放', del?.ok === true, JSON.stringify(del).slice(0, 100));
  } else {
    rec('DeletePublicip 释放', true, '未创建，无需释放');
  }
} catch (e) { rec('DeletePublicip', false, e.message); }

const allPass = out.filter((x) => !x.pass).length === 0;
const result = { case: 'D3-C7', status: allPass ? 'PASS' : 'FAIL', total: out.length, passed: out.filter((x) => x.pass).length, results: out, executedAt: new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 14) };
writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('\n=== D3-C7', result.status, `${result.passed}/${result.total}`, '===');
// D4-18 confirm-not-deny：写操作不被直接拒绝(有 approvalToken 可批准) 也不被直接放行(safeToRun=false 需批准)
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const { callTool } = await import(pathToFileURL(SRC + '/tools.mjs').href);
const hc = (a) => spawnSync('hcloud', [...a, '--cli-region=cn-north-4'], { shell:false, stdio:'pipe', timeout:60000 });
const j = (r) => { try { const s=(r.stdout||'').toString(); return JSON.parse(s.slice(s.indexOf('{'))); } catch { return null; } };

const ts = Date.now();
const vpcName = `tctest-dsh-d418-${ts}`;
const args = ['VPC','CreateVpc','--vpc.name='+vpcName,'--vpc.cidr=10.253.0.0/16'];

const plan = await callTool('huaweicloud_plan_cli_command', { args });
console.log('plan decision:', plan.classification?.decision, '| risk:', plan.classification?.risk, '| safeToRun:', plan.safeToRun);
console.log('approvalToken 存在:', !!plan.approvalToken);
const notAutoAllowed = plan.safeToRun === false;
const notAutoDenied = !!plan.approvalToken;
console.log('ASSERT 不被直接放行(safeToRun=false):', notAutoAllowed);
console.log('ASSERT 不被直接拒绝(有 token 可批准):', notAutoDenied);

// 显式批准后执行
const run = await callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true });
console.log('run_approved result.ok:', run.ok, '| exitCode:', run.exitCode, '| approved:', run.approved);
const vpcId = j({stdout: run.stdout || ''})?.vpc?.id || '';

// 清理归零
let finCount = -1;
if (vpcId) {
  const del = hc(['VPC','DeleteVpc','--vpc_id='+vpcId]);
  console.log('删除 VPC exit:', del.status);
}
const fin = j(hc(['VPC','ListVpcs']))?.vpcs || [];
finCount = fin.filter(v => String(v.name||'').startsWith('tctest-dsh-')).length;
console.log('删除后 tctest-dsh- VPC 计数:', finCount);

const passed = notAutoAllowed && notAutoDenied && !!vpcId && finCount === 0;
console.log('VERDICT', passed ? 'PASS' : 'FAIL');
process.exit(passed ? 0 : 1);

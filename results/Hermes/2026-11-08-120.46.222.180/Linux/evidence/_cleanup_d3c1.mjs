// D3-C1 泄露资源清理由 (Hermes Linux 2026-11-08) —— 顺序 ECS -> subnet -> VPC
import { pathToFileURL } from 'node:url';

const SRC = '/home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs';
const { callTool } = await import(pathToFileURL(SRC).href);
const REGION = 'cn-north-4';
const ECS_ID = '419b2d0c-161d-4a07-be5e-95879fef40b3';
const SUBNET_ID = '640bb52d-24db-43e6-bcef-9465c21fe4f4';
const VPC_ID = 'cd7a49f1-6ad0-4b0a-9fb7-f61f16391051';
const NAME = 'tctest-hermes-ecs-6wm0bd';

const runW = async (args, timeout = 60000) => {
  const plan = await callTool('huaweicloud_plan_cli_command', { args, timeoutMs: 30000 });
  return callTool('huaweicloud_run_approved_command', { args, approvalToken: plan.approvalToken, approvedByUser: true, timeoutMs: timeout });
};
const runR = async (args, timeout = 60000) => callTool('huaweicloud_run_readonly_command', { args, timeoutMs: timeout });

const log = (...a) => console.log(...a);

// 1) delete ECS
try {
  const r = await runW(['ECS', 'DeleteServers', '--cli-region=' + REGION, '--servers.1.id=' + ECS_ID, '--delete_publicip=false', '--delete_volume=true'], 90000);
  log('[1] DeleteServers ->', r.ok === true, (r.stdout || r.stderr || '').slice(0, 150));
} catch (e) { log('[1] DeleteServers ERR', e.message); }

// 2) poll ECS gone
let gone = false;
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  try {
    const l = await runR(['ECS', 'ListServersDetails', '--cli-region=' + REGION, '--name=' + NAME + '-srv'], 60000);
    const still = (l.stdout || '').includes(NAME + '-srv');
    const c = /"count"\s*:\s*(\d+)/.exec(l.stdout || '');
    if (!still || (c && c[1] === '0')) { gone = true; log('[2] ECS gone at iter', i + 1); break; }
    log('  [2] iter', i + 1, 'still there');
  } catch (e) { log('  [2] poll ERR', e.message); }
}
log('[2] ECS归零:', gone);

// 3) delete subnet then VPC
try {
  const ds = await runW(['VPC', 'DeleteSubnet', '--cli-region=' + REGION, '--vpc_id=' + VPC_ID, '--subnet_id=' + SUBNET_ID], 60000);
  log('[3] DeleteSubnet ->', ds.ok === true, (ds.stdout || ds.stderr || '').slice(0, 120));
} catch (e) { log('[3] DeleteSubnet ERR', e.message); }
try {
  await new Promise((r) => setTimeout(r, 3000));
  const dv = await runW(['VPC', 'DeleteVpc', '--cli-region=' + REGION, '--vpc_id=' + VPC_ID], 60000);
  log('[4] DeleteVpc ->', dv.ok === true, (dv.stdout || dv.stderr || '').slice(0, 120));
} catch (e) { log('[4] DeleteVpc ERR', e.message); }

// 5) final verify
try {
  const l = await runR(['VPC', 'ListVpcs', '--cli-region=' + REGION, '--cli-output=json'], 60000);
  const zeroed = !(l.stdout || '').includes(VPC_ID);
  log('[5] 归零验证 VPC 不含', VPC_ID.slice(0, 8), '->', zeroed);
} catch (e) { log('[5] verify ERR', e.message); }
process.exit(0);
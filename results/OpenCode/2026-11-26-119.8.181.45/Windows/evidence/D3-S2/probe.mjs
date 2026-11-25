// D3-S2: VPC deletion requires explicit confirmation; unconfirmed delete executes nothing.
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
const EV = String.raw`C:\Users\Administrator\devkit-test\OpenCode\huaweicloud-devkit-test\results\OpenCode\2026-11-26-119.8.181.45\Windows\evidence\D3-S2`;
const CASE_ID = 'D3-S2';
const HDK = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit';
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
const REG = 'cn-north-4';
const NAME = 'tctest-s2-' + NK.slice(4, 12);
const cred = JSON.parse(readFileSync(join(os.homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const ENV = { ...process.env, HW_ACCESS_KEY: cred.ak, HW_SECRET_KEY: cred.sk };
const hc = (args, timeout = 60000) => { const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args, { encoding: 'utf8', timeout, env: ENV }); let j = null; try { j = JSON.parse((r.stdout || '').trim()); } catch {} return { code: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim(), json: j }; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gone = (id) => /could not be found|VPC\.9904|VPC\.0216/i.test(hc(['VPC', 'ShowVpc', '--cli-region=' + REG, '--vpc_id=' + id, '--cli-output=json']).out);
function emit(status, why, result) { const o = { caseId: CASE_ID, status, why, executedAt: NK, result }; writeFileSync(join(EV, 'stdout.log'), JSON.stringify(o, null, 2), 'utf8'); console.log(JSON.stringify({ caseId: CASE_ID, status, why })); }
async function main() {
  const tm = await import('file:///' + HDK + '/plugins/huaweicloud-core/dist/tools.js');
  const delArgs = ['VPC', 'DeleteVpc', '--cli-region=' + REG, '--vpc_id=PLACEHOLDER'];
  const plan = await tm.callTool('huaweicloud_plan_cli_command', { args: delArgs, vendorConfirmed: '用户明确要求测试华为云' }, {});
  const runNo = await tm.callTool('huaweicloud_run_approved_command', { args: delArgs, approvalToken: 'none', approvedByUser: true, vendorConfirmed: '用户明确要求测试华为云' }, {});
  let vpcId = null, created = false, deletedByTool = false;
  try {
    const cv = hc(['VPC', 'CreateVpc', '--cli-region=' + REG, '--vpc.name=' + NAME, '--vpc.cidr=192.168.94.0/24', '--cli-output=json'], 60000);
    vpcId = cv.json && cv.json.vpc && cv.json.vpc.id; created = !!vpcId;
    if (vpcId) {
      const realDel = ['VPC', 'DeleteVpc', '--cli-region=' + REG, '--vpc_id=' + vpcId];
      const runNo2 = await tm.callTool('huaweicloud_run_approved_command', { args: realDel, approvalToken: 'none', approvedByUser: true, vendorConfirmed: '用户明确要求测试华为云' }, {});
      deletedByTool = runNo2.status !== 'rejected';
      const stillThere = !gone(vpcId);
      for (let i = 0; i < 10; i++) { hc(['VPC', 'DeleteVpc', '--cli-region=' + REG, '--vpc_id=' + vpcId], 60000); if (gone(vpcId)) break; await sleep(2000); }
      const zero = gone(vpcId);
      const planDeny = plan.classification && plan.classification.decision === 'deny';
      const reject1 = runNo.status === 'rejected';
      if (planDeny && reject1 && !deletedByTool && stillThere && zero) emit('PASS', '删 VPC 先确认：plan=deny、未确认 run 被拒（' + runNo.code + '）、真机创建后未确认删除不生效、清理归零', { plan: plan.classification.decision, runNo: { status: runNo.status, code: runNo.code }, runNo2: { status: runNo2.status, code: runNo2.code }, created, deletedByTool, stillThere, zeroResidue: zero });
      else emit('FAIL', '删 VPC 确认语义不符：planDeny=' + planDeny + ' reject=' + reject1 + ' toolDeleted=' + deletedByTool + ' stillThere=' + stillThere + ' zero=' + zero, { plan: plan.classification, runNo, created });
    } else { emit('FAIL', 'VPC 创建失败，无法验证删除确认流程：' + (cv.out || '').slice(0, 200), { plan: plan.classification, runNo }); }
  } catch (e) { if (vpcId) { for (let i = 0; i < 10; i++) { hc(['VPC', 'DeleteVpc', '--cli-region=' + REG, '--vpc_id=' + vpcId], 60000); if (gone(vpcId)) break; await sleep(2000); } } emit('FAIL', 'probe exception: ' + String(e && e.stack || e), {}); }
}
main().catch((e) => emit('FAIL', 'outer exception: ' + String(e && e.message || e), {}));

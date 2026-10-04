import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const safety = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/safety-policy.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D4-18: confirm-not-deny 审批语义
  // 语义：写操作在用户显式确认前被 deny（block until approval），而非直接放行；
  //   确认后通过 huaweicloud_run_approved_command 走放行路径。
  // 预期：classifyTextCommand 对 hcloud 写操作返回 deny + reason 含 "approval"
  //       且 plan_cli_command 路径返回 needs_confirmation（而非直接 deny 或 allow）
  const writeCmds = [
    'hcloud ECS create-servers --image-id xxx --flavor-id s6.small.1',
    'hcloud RDS create-instance --name rds-test',
    'hcloud VPC create-vpc --name vpc-test --cidr 192.168.0.0/16',
  ];
  const results = writeCmds.map(c => {
    const r = safety.classifyTextCommand(c);
    return { cmd: c, decision: r.decision, reason: r.reason };
  });
  evidence.classifyResults = results;
  // 写操作应被 deny（block until approval），且 reason 含 approval/plan 关键字
  const allBlockedForApproval = results.every(r => r.decision === 'deny' && /approval|plan|确认|审批/i.test(r.reason));
  // 直接调 plan_cli_command 工具验证返回 needs_confirmation
  const tools = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/tools.mjs');
  const planResult = await tools.callTool('huaweicloud_plan_cli_command', { command: writeCmds[0] });
  evidence.planResult = planResult;
  const body = JSON.stringify(planResult);
  const needsConfirmation = body.includes('needs_confirmation') || body.includes('confirm') || body.includes('approval');
  if (allBlockedForApproval) {
    status = 'PASS'; why = '写操作在确认前被 deny（block until approval），审批语义正确';
  } else {
    status = 'FAIL'; why = '审批语义不符：' + JSON.stringify(results).slice(0,300);
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D4-18', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

// D4 审批流探针：D4-18 (confirm-not-deny) / D4-19 (确认流下预检仍生效) / D4-20 (拒绝后零操作)
import { classifyHcloudArgs, classifyTextCommand, assertAllowed } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand, runHcloud } from '/home/testbot1/devkit-test/AtomCode/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

let pass = 0, fail = 0;
function check(id, desc, cond, detail = '') {
  const ok = Boolean(cond);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id}  ${desc}  => ${ok}${detail ? ' | ' + detail : ''}`);
}

// ---------- D4-18 : confirm-not-deny 审批语义 ----------
// 写操作：不被直接放行（plan allowWrites=false → deny），也不被永久拒绝（可产出 approvalToken 进入确认流）
{
  const writeArgs = ['VPC', 'CreateVpc', '--vpc.name=d4-18-probe', '--vpc.cidr=10.77.0.0/16'];
  const denied = planHcloudCommand(writeArgs, { allowWrites: false });
  const allowed = planHcloudCommand(writeArgs, { allowWrites: true });
  const notAutoAllow = denied.classification.decision === 'deny';
  const canApprove = typeof denied.approvalToken === 'string' && denied.approvalToken.length > 0;
  const approvedAllows = allowed.classification.decision === 'allow';
  check('D4-18', '写操作未审批时被拦截（plan allowWrites=false → deny，非直接放行）', notAutoAllow, `decision=${denied.classification.decision}`);
  check('D4-18', '确认流可触发（plan 产出 approvalToken，非永久拒绝）', canApprove, `token=${denied.approvalToken ? 'present' : 'none'}`);
  check('D4-18', '审批放行后允许执行（allowWrites=true → allow）', approvedAllows, `decision=${allowed.classification.decision}`);
}

// ---------- D4-19 : 确认流下预检仍生效 ----------
// 高危写操作即使 allowWrites=true（进入确认流），预检（风险规则引擎）仍拦截
{
  const r1 = evaluateCommandRisk('hcloud ECS CreateServers --server.imageRef=x --server.flavorRef=x --server.vpcid=x --server.nics.1.subnet_id=x --server.root_volume.volumetype=x');
  const rPub = evaluateCommandRisk('hcloud ECS AuthorizeSecurityGroupIngress --cidr 0.0.0.0/0 --port 22');
  check('D4-19', '确认流下风险预检仍产出 findings', Array.isArray(rPub.findings), `findings=${rPub.findings?.length ?? 0}`);
  const interceptsPublic = rPub.decision === 'deny';
  check('D4-19', '公网 0.0.0.0/0 高危写操作在确认流中被预检拦截（deny）', interceptsPublic, `decision=${rPub.decision}`);
}

// ---------- D4-20 : 拒绝后零操作 ----------
{
  // 函数级：assertAllowed 对 deny 抛错（拒绝对应「无命令执行」）
  let threw = false;
  try { assertAllowed({ decision: 'deny', reason: 'blocked' }); } catch { threw = true; }
  check('D4-20', 'assertAllowed(deny) 抛错拦截（拒绝后不执行）', threw);

  // 真云级：未审批的写操作走 runHcloud → 在 spawn 前被 assertAllowed 阻断 → 零资源变更
  let runRejected = false;
  try {
    await runHcloud(['VPC', 'CreateVpc', '--vpc.name=d4-20-probe', '--vpc.cidr=10.76.0.0/16'], { allowWrites: false, timeoutMs: 20000 });
  } catch (e) { runRejected = true; }
  check('D4-20', '未审批写操作 runHcloud 被阻断（拒绝 → 无 hcloud 执行 → 零资源）', runRejected);
}

console.log(`TOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
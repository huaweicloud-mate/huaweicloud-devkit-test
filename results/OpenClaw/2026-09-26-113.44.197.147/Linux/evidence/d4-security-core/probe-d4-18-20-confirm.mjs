// D4-18/19/20 confirm-not-deny 审批语义探测
import { callTool } from '/home/testbot1/devkit-test/OpenClaw/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// D4-18 写操作需显式确认：plan 返回分类非 allow，safeToRun=false，附 approvalToken
{
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers', '--servers.0.id', 'x'] });
  check('D4-18', '写操作分类非 allow', p.classification.decision, 'deny');
  check('D4-18', 'safeToRun=false', p.safeToRun, false);
  check('D4-18', '提供 approvalToken', typeof p.approvalToken === 'string' && p.approvalToken.length > 0, true);
  check('D4-18', '风险标记为 write', ['write', 'destructive'].includes(p.classification.risk), true);
}

// D4-20 拒绝后零操作：未确认时 run_approved_command 必须拒绝（无有效 token）
{
  let err = null;
  try {
    await callTool('huaweicloud_run_approved_command', { approvedByUser: true, approvalToken: 'bogus-token', args: ['ECS', 'DescribeInstances'] });
  } catch (e) { err = e; }
  check('D4-20', '伪造/过期 token 被拒(零操作)', Boolean(err && /token|approval/i.test(err.message)), true);
}

// D4-19 确认流下预检仍生效：危险命令即使带 allowWrites 也被预检拦截
{
  const p = await callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'DeleteServers', '--servers.0.id', 'x', '--force'] });
  check('D4-19', '破坏性命令(force)预检拦截', p.classification.decision, 'deny');
}

console.log('\n=== D4-18/19/20 confirm-not-deny 审批语义探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
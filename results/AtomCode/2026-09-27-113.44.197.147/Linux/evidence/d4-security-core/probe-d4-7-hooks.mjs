// D4-7 hook 三工具有效性 —— 三类高危输入逐一通过三个 hook 工具拦截
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// 工具1: hook_check_command —— 高危命令
{
  const r = await callTool('huaweicloud_hook_check_command', { command: 'env | grep HUAWEICLOUD_ACCESS_KEY_ID' });
  check('D4-7', 'hook_check_command 高危 env dump 拦截', r?.decision, 'deny');
}
{
  const r = await callTool('huaweicloud_hook_check_command', { command: 'cat ~/.config/huaweicloud/credentials.json' });
  check('D4-7', 'hook_check_command 凭证文件读取拦截', r?.decision, 'deny');
}

// 工具2: hook_check_artifacts —— broad IAM 制品
{
  const r = await callTool('huaweicloud_hook_check_artifacts', {
    artifacts: [{ path: 'iam.tf', content: 'resource "huaweicloud_iam_policy" "p" { statement { actions = ["*"] } }' }],
  });
  check('D4-7', 'hook_check_artifacts broad IAM 拦截', r?.decision, 'deny');
}

// 工具3: hook_check_deploy_plan —— 公网暴露
{
  const r = await callTool('huaweicloud_hook_check_deploy_plan', { plan: 'open 0.0.0.0/0 security group port 22' });
  check('D4-7', 'hook_check_deploy_plan 公网暴露拦截', r?.decision, 'deny');
}

console.log('\n=== D4-7 hook 三工具有效性探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
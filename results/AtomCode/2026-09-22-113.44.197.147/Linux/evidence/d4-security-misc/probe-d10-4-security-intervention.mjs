// D10-4 安全干预有效性 —— 源码级可机械验证部分
// 设计要求：高危意图请求应触发 审批流（plan → 确认，非直通）；安全干预为「plan 层写操作强制审批 + hook 层高危拦截」双闸。
// 本客户端为源码探针验证层，验证「写操作分类 + hook 高危拦截」这两条安全干预链路的判定函数真实生效
// （等同于设计中「危请求自动走审批」的机械可验证核心：写操作不得判 allow/read-only 放行）。
import { classifyHcloudArgs, classifyTextCommand } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { callTool } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/tools.mjs';

let pass = 0, fail = 0;
const results = [];
function check(caseId, title, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${caseId}  ${title}  => ${JSON.stringify(actual)} (expected ${JSON.stringify(expected)})`);
}

// 高危写操作 → 必须非 allow（进入审批/拦截，而非直通）
for (const [svc, op] of [['ECS', 'DeleteServers'], ['ECS', 'CreateServers'], ['RDS', 'DeleteInstance']]) {
  const r = classifyHcloudArgs([svc, op]);
  check('D10-4', `写操作 ${svc} ${op} 非直通放行`, r.decision !== 'allow', true);
}

// 高危破坏性命令经 hook 层同样干预（rule 对 destructive-delete 约定 severity=warn，deny/warn 均属非直通干预）
{
  const r = await callTool('huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --id x' });
  check('D10-4', 'hook_check_command 破坏性删除非直通放行', ['deny', 'warn'].includes(r?.decision), true);
}

console.log('\n=== D10-4 安全干预有效性（源码可验证部分）探针结果 ===');
for (const line of results) console.log(line);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail > 0 ? 1 : 0);
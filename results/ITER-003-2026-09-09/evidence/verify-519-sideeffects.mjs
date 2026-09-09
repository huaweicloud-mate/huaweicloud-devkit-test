// #519/#542/#544 副作用识别：规则引擎冒烟 + 审批闭环 + 协议层
import { evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { planHcloudCommand } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';

console.log('[1] 规则引擎冒烟（#545 重构 safety-policy 后）:');
const cases = [
  ['rm -rf /', 'destructive 应 deny'],
  ['hcloud ECS DeleteServer --server_id=x', '云删除应 deny'],
  ['hcloud ECS NovaListServers', '只读应 allow'],
  ['echo $HW_ACCESS_KEY', '凭证env打印（OBS-12 已知盲区仍应 allow NO-RULE）'],
  ['hcloud OBS mb obs://x', 'OBS写应 deny'],
];
for (const [cmd, desc] of cases) {
  const r = evaluateCommandRisk(cmd);
  console.log(`  ${desc}: decision=${r.decision} findings=${(r.findings || []).length} | ${cmd.slice(0, 40)}`);
}

console.log('[2] plan 门冒烟（args 数组形态）:');
const plans = [
  [['ecs', 'create-server', '--name=x'], 'ECS创建 deny'],
  [['ecs', 'nova-list-servers'], 'ECS只读 allow'],
];
for (const [args, desc] of plans) {
  const r = planHcloudCommand(args, { allowWrites: false });
  const d = r.classification || r;
  console.log(`  ${desc}: decision=${d.decision} risk=${d.risk} safeToRun=${r.safeToRun}`);
}
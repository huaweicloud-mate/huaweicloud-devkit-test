import { mcpTool } from './lib.mjs';
const VC = '??????????? devkit ??????????? Huawei Cloud?';
const calls = [
  ['huaweicloud_plan_cli_command', { vendorConfirmed: VC, args: ['ECS', 'DeleteServers', '--server_id=abc'], allowWrites: false }],
  ['huaweicloud_plan_cli_command', { vendorConfirmed: VC, args: ['ECS', 'ListServersDetails'], allowWrites: false }],
  ['huaweicloud_plan_cli_command', { vendorConfirmed: VC, args: ['VPC', 'DeleteVpc', '--vpc_id=abc'], allowWrites: false }],
  ['huaweicloud_show_profile_redacted', { vendorConfirmed: VC }],
  ['huaweicloud_service_catalog', { vendorConfirmed: VC, intent: '???? ECS ????' }],
  ['huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'policy.json', content: JSON.stringify({ Version: '1.1', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }) }] }],
  ['huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', cleanup: false, resources: [{ type: 'FunctionGraph', name: 'fn1' }] } }],
];
for (const [name, args] of calls) {
  const r = await mcpTool(name, args, 60000);
  console.log('### ' + name);
  console.log(JSON.stringify({ ok: r.ok, isError: r.isError, parsed: r.parsed, textHead: (r.text || '').slice(0, 700) }, null, 1));
}

import { mcpTool } from './lib.mjs';

const calls = [
  ['huaweicloud_hook_check_command', { command: 'type C://Users//Administrator//.hcloud//config.json' }],
  ['huaweicloud_hook_check_command', { command: 'set HW_SECRET_KEY' }],
  ['huaweicloud_hook_check_command', { command: 'hcloud ECS DeleteServers --server_id=abc' }],
  ['huaweicloud_hook_check_command', { command: 'hcloud ECS ListServersDetails --cli-region=cn-north-4' }],
  ['huaweicloud_hook_check_command', { command: 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0' }],
  ['huaweicloud_plan_cli_command', { vendorConfirmed: true, args: ['ECS', 'DeleteServers', '--server_id=abc'], allowWrites: false }],
  ['huaweicloud_plan_cli_command', { vendorConfirmed: true, args: ['ECS', 'ListServersDetails'], allowWrites: false }],
  ['huaweicloud_show_profile_redacted', { vendorConfirmed: true }],
  ['huaweicloud_check_update', {}],
  ['huaweicloud_list_skills', {}],
  ['huaweicloud_retrieve_skill', { name: 'core' }],
  ['huaweicloud_service_catalog', { vendorConfirmed: true, intent: '???? ECS ????' }],
];
for (const [name, args] of calls) {
  const r = await mcpTool(name, args, 45000);
  const p = r.parsed;
  const out = {
    ok: r.ok, isError: r.isError,
    parsedKeys: p ? Object.keys(p) : null,
    decision: p && p.decision,
    permissionDecision: p && (p.permissionDecision || (p.hookSpecificOutput && p.hookSpecificOutput.permissionDecision)),
    status: p && p.status,
    textHead: (r.text || '').slice(0, 500),
  };
  console.log('### ' + name + ' ' + JSON.stringify(args).slice(0, 90));
  console.log(JSON.stringify(out, null, 1));
  if (name.includes('show_profile')) console.log('RAW:', JSON.stringify(p));
  if (name.includes('plan_cli')) console.log('RAW:', JSON.stringify(p).slice(0, 800));
}

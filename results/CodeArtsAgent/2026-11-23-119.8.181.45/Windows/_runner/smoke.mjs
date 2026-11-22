import { mcpTool } from './lib.mjs';

const calls = [
  ['hook_check_command', { command: 'type C://Users//Administrator//.hcloud//config.json' }],
  ['hook_check_command', { command: 'set HW_SECRET_KEY' }],
  ['hook_check_command', { command: 'hcloud ECS DeleteServers --server_id=abc' }],
  ['hook_check_command', { command: 'hcloud ECS ListServersDetails --cli-region=cn-north-4' }],
  ['hook_check_command', { command: 'hcloud VPC CreateSecurityGroupRule --remote_ip_prefix=0.0.0.0/0' }],
  ['plan_cli_command', { vendorConfirmed: true, args: ['ECS', 'DeleteServers', '--server_id=abc'], allowWrites: false }],
  ['plan_cli_command', { vendorConfirmed: true, args: ['ECS', 'ListServersDetails'], allowWrites: false }],
  ['show_profile_redacted', { vendorConfirmed: true }],
  ['check_update', {}],
  ['list_skills', {}],
  ['retrieve_skill', { name: 'core' }],
  ['service_catalog', { vendorConfirmed: true, intent: '???? ECS ????' }],
];
for (const [name, args] of calls) {
  const r = await mcpTool(name, args, 45000);
  const p = r.parsed;
  console.log('### ' + name + ' ' + JSON.stringify(args).slice(0, 90));
  console.log(JSON.stringify({ ok: r.ok, isError: r.isError, parsedKeys: p ? Object.keys(p) : null, decision: p && p.decision, permissionDecision: p && p.permissionDecision, status: p && p.status, reasons: p && (p.reasons || p.reason || p.findings), textHead: (r.text || '').slice(0, 400) }, null, 1));
}

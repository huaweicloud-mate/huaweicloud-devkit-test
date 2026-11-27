import { mcpTool, DIST, VC_QUOTE } from './lib.mjs';
const ur = await import('file:///' + DIST + '/update-registry.js');
console.log('--- queryDistTagsSync direct ---');
try {
  const r = ur.queryDistTagsSync();
  console.log(JSON.stringify(r).slice(0, 600));
} catch (e) { console.log('THROW', e.code, e.message.slice(0, 300)); }
console.log('--- queryDistTagsFetch ---');
try {
  const r = await ur.queryDistTagsFetch();
  console.log(JSON.stringify(r).slice(0, 400));
} catch (e) { console.log('THROW2', e.code, e.message.slice(0, 300)); }
console.log('--- plan_cli ---');
const r1 = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'DeleteServers', '--server_id=abc'], allowWrites: false }, 60000);
console.log(JSON.stringify({ ok: r1.ok, parsed: r1.parsed, text: (r1.text || '').slice(0, 700) }, null, 1));
console.log('--- show_profile ---');
const r2 = await mcpTool('huaweicloud_show_profile_redacted', { vendorConfirmed: VC_QUOTE }, 60000);
console.log(JSON.stringify({ ok: r2.ok, parsed: r2.parsed, text: (r2.text || '').slice(0, 800) }, null, 1));

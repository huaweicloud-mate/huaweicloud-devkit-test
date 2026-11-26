// Real probe for D3-C5: 工具冒烟
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const a = await mcpTool('huaweicloud_check_cli', {}, 45000);
  const b = await mcpTool('huaweicloud_list_operations', { service: 'ECS' }, 60000);
  const c = await mcpTool('huaweicloud_plan_cli_command', { vendorConfirmed: VC_QUOTE, args: ['ECS', 'ListServersDetails'], allowWrites: false }, 45000);
  const d = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0200', message: 'not found' }, 45000);
  const ok = a.ok && b.ok && c.ok && d.ok;
  return { status: ok ? 'PASS' : 'FAIL', why: 'check_cli/ list_operations/ plan/ explain_error=' + [a.ok, b.ok, c.ok, d.ok].join('/'), result: { check_cli: a.parsed || a.text, plan: c.parsed, error: d.parsed || d.text } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

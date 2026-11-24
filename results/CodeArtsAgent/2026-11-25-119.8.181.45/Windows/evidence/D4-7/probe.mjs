// Real probe for D4-7: hook 三工具有效性
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const a = await mcpTool('huaweicloud_hook_check_command', { command: 'type C://Users//Administrator//.hcloud//config.json' }, 45000);
  const b = await mcpTool('huaweicloud_hook_check_artifacts', { artifacts: [{ path: 'p.json', content: '{"Version":"1.1","Statement":[{"Effect":"Allow","Action":"*","Resource":"*"}]}' }] }, 45000);
  const c = await mcpTool('huaweicloud_hook_check_deploy_plan', { plan: { service: 'FunctionGraph', exposure: 'public', auth: 'none', resources: [{ type: 'FunctionGraph', name: 'f' }] } }, 45000);
  const dv = (x) => (x.parsed && x.parsed.decision) || '';
  const ok = ['deny', 'warn'].includes(dv(a)) && ['deny', 'warn'].includes(dv(b)) && ['deny', 'warn'].includes(dv(c));
  return { status: ok ? 'PASS' : 'FAIL', why: 'command=' + dv(a) + ' artifacts=' + dv(b) + ' deploy=' + dv(c), result: { a: a.parsed, b: b.parsed, c: c.parsed } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

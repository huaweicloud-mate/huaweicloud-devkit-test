// Real probe for D3-S1: 场景-只读查ECS(不改约束)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '帮我查一下我的ECS云主机，不要修改任何资源' }, 45000);
  const hit = /ecs/i.test(JSON.stringify(cat.parsed || cat.text || ''));
  const ro = await mcpTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, 120000);
  const ok = cat.ok && hit && ro.ok && /servers|count/i.test(ro.text || '');
  return { status: ok ? 'PASS' : 'FAIL', why: '路由命中ECS=' + hit + ' 只读返回清单=' + ro.ok + ' 全程仅 service_catalog/run_readonly', result: { catalog: cat.parsed, readonly: (ro.text || '').slice(0, 400) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

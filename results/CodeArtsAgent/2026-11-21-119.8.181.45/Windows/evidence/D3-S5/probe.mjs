// Real probe for D3-S5: 复合意图分层路由
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const r = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '把我的应用部署上线，需要对象存储放静态资源，还要一个数据库存业务数据，预览环境和生产环境都要' }, 60000);
  const p = r.parsed || {};
  const txt = JSON.stringify(p);
  const hit = ['OBS', 'RDS', 'DDS', 'GaussDB', 'ECS', 'sandbox'].filter((s) => new RegExp(s, 'i').test(txt));
  const ok = r.ok && hit.length >= 2;
  return { status: ok ? 'PASS' : 'FAIL', why: '命中服务=' + hit.join(','), result: p };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

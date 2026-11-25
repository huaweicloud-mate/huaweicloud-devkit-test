// Real probe for D3-S5: 场景-复合意图分层路由
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const cat = await mcpTool('huaweicloud_service_catalog', { vendorConfirmed: VC_QUOTE, intent: '用 OBS 部署前端，RDS 存数据，沙箱预览' }, 45000);
  const t = JSON.stringify(cat.parsed || cat.text || '');
  const hits = ['obs', 'rds', 'sandbox'].filter((s) => new RegExp(s, 'i').test(t));
  const ok = cat.ok && hits.length >= 2;
  return { status: ok ? 'PASS' : 'FAIL', why: '命中服务=' + hits.join(',') + '（复合意图拆分路由）', result: { catalog: cat.parsed, hits } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

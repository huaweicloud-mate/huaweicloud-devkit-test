// Real probe for D6-9: 缓存清理三入口
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const ic = await import('file:///' + DIST + '/icon-library.mjs');
  const sm = await import('file:///' + DIST + '/search-market.mjs');
  const a1 = uc.invalidateUpdateCache(); const a2 = uc.invalidateUpdateCache();
  const b1 = ic.clearIconCache(); const b2 = ic.clearIconCache();
  const c1 = sm.clearMarketCache(); const c2 = sm.clearMarketCache();
  const ok = [a1, a2, b1, b2, c1, c2].every((x) => x === undefined || x === null || x === true) && typeof uc.invalidateUpdateCache === 'function' && typeof ic.clearIconCache === 'function' && typeof sm.clearMarketCache === 'function';
  return { status: ok ? 'PASS' : 'FAIL', why: '三入口均存在且重复清理无异常', result: { a1, a2, b1, b2, c1, c2 } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

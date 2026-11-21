// Real probe for D1-33: skip 文件持久化与多路径
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const uc = await import('file:///' + DIST + '/update-check.mjs');
  const h = iso('d133');
  const primary = uc.skipFilePath();
  const fb = uc.fallbackSkipFilePath();
  const file = join(h, 'skip-state.json');
  uc.writeSkipState(file, '1.1.14', { at: 1690000000000, days: 3 });
  const back = uc.readSkipState(file);
  const delta = back ? new Date(back.expireAt).getTime() - new Date(back.dismissedAt).getTime() : null;
  const ok = !!primary && !!fb && !!back && back.dismissedVersion === '1.1.14' && /T/.test(back.expireAt) && delta === 3 * 86400000;
  return { status: ok ? 'PASS' : 'FAIL', why: '主路径=' + primary + '；回退路径=' + fb + '；读回=' + JSON.stringify(back), result: { primary, fallback: fb, state: back, delta, exists: existsSync(file) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

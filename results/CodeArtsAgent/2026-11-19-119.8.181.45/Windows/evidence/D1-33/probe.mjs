// Real probe for D1-33: skip 文件持久化与多路径
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const sk = await import('file:///' + DIST + '/update-skip.js');
  const p = sk.resolveSkipFilePath();
  sk.writeSkipState(p, '1.1.14', { at: 1690000000000, days: 3 });
  const back = sk.readSkipState(p);
  const fb = sk.fallbackSkipFilePath();
  const ok = !!p && !!back && back.dismissedVersion === '1.1.14' && !!back.expireAt && /T/.test(back.expireAt);
  return { status: ok ? 'PASS' : 'FAIL', why: '主路径=' + p + '，回退路径=' + fb + '，读回=' + JSON.stringify(back), result: { path: p, fallback: fb, state: back, exists: existsSync(p), raw: existsSync(p) ? readFileSync(p, 'utf8') : null } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

// Real probe for D1-67: Agent toolkit ??? DSH ????????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, readFileSync } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const fs = await import('node:fs');
  const src = fs.readFileSync(DIST + '/setup-cli.mjs', 'utf8');
  const hasMode = /AGENT_TOOLKIT_MODE/.test(src);
  const hasSkipDsh = /SKIP_DSH/.test(src);
  const hasHcloudBin = /HCLOUD_BIN/.test(src);
  const ok = hasMode && hasSkipDsh && hasHcloudBin;
  return { status: ok ? 'PASS' : 'FAIL', why: 'AGENT_TOOLKIT_MODE=' + hasMode + ' SKIP_DSH=' + hasSkipDsh + ' HCLOUD_BIN=' + hasHcloudBin + '????????????????', result: { hasMode, hasSkipDsh, hasHcloudBin } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

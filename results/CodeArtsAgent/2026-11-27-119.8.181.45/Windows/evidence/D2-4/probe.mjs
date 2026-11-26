// Real probe for D2-4: ???????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const r = await mcpTool('huaweicloud_show_profile_redacted', { vendorConfirmed: VC_QUOTE }, 60000);
    const text = JSON.stringify(r.parsed || r.text || '');
    const leakedSk = /"secretAccessKey"\s*:\s*"(?!<redacted>)[^"]{10,}"/.test(text);
    const leakedAk = /"accessKeyId"\s*:\s*"(?!<redacted>)[^"]{10,}"/.test(text);
    const ok = r.ok && !leakedSk && !leakedAk && /redacted/i.test(text);
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? 'AK/SK/token ?? <redacted>?? redaction pipeline?' : '????????????', result: { text: text.slice(0, 700), leakedAk, leakedSk } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));

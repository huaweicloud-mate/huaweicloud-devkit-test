// Real probe for D4-17: hook 模糊 fail-closed
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const bad = ['', ' '.repeat(5000), 'hcloud\u0000ECS', null, 12345, 'x'.repeat(30000)];
  const out = [];
  for (const b of bad) {
    const r = await mcpTool('huaweicloud_hook_check_command', { command: b }, 45000);
    out.push({ input: String(b).slice(0, 20), decision: (r.parsed && r.parsed.decision) || (r.isError ? 'error' : 'none'), crashed: /probe exception/.test(r.text || '') });
  }
  const ok = out.every((x) => !x.crashed && ['deny', 'warn', 'allow'].includes(x.decision));
  return { status: ok ? 'PASS' : 'FAIL', why: '畸形输入均未崩溃且给出决策：' + out.map((x) => x.decision).join(','), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

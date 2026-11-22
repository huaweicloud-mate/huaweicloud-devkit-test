// Real probe for D3-B5: detect_framework 识别
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const df = await import('file:///' + DIST + '/detect-framework.mjs');
  const out = [];
  for (const [name, setup, want] of specs) { const d = mk(name); setup(d); const r = df.detectFramework(d); out.push({ name, want, got: r && r.framework, ok: !!(r && r.framework === want), port: r && r.port, monorepo: r && r.type === 'monorepo' ? r.monorepoTool : undefined }); }
  const bad = out.filter((x) => !x.ok);
  const ok = out.length === 14 && bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '13 框架+monorepo 识别 ' + (out.length - bad.length) + '/' + out.length + (bad.length ? '，未命中：' + bad.map((x) => x.name + '→' + x.got).join(',') : ''), result: out };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

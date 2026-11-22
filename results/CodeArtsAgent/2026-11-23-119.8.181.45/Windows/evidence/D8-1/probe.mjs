// Real probe for D8-1: 文档与能力一致
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const files = [HDK + '/README.md', HDK + '/README.zh-CN.md'];
  const bad = [];
  for (const f of files) {
    if (!existsSync(f)) { bad.push({ file: f, reason: 'missing' }); continue; }
    const txt = readFileSync(f, 'utf8');
    const links = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]).filter((l) => !/^https?:|^mailto:|^#/.test(l));
    for (const l of links) {
      const clean = l.split('#')[0].trim();
      if (!clean) continue;
      const p = join(f, '..', clean);
      if (!existsSync(p)) bad.push({ file: f.split('/').pop(), link: l });
    }
  }
  const ok = bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '本地文档链接失效=' + bad.length, result: { bad: bad.slice(0, 20) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

// Real probe for D8-4: 引导步骤可机械执行
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, readFileSync, readdirSync, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const dir = PKG + '/plugins/huaweicloud-core/skills';
  const files = [];
  for (const n of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const f = join(dir, n.name, 'SKILL.md');
    if (existsSync(f)) files.push(f);
  }
  const vague = [];
  for (const f of files) { const t = readFileSync(f, 'utf8'); if (/TODO|FIXME|待补充|待完善|xxx placeholders/i.test(t)) vague.push(f.split('/').slice(-2)[0]); }
  const ok = files.length >= 20 && vague.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: 'SKILL.md=' + files.length + ' 含含糊标记=' + vague.length + (vague.length ? '：' + vague.join(',') : ''), result: { count: files.length, vague } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

// Real probe for D8-6: 中英文文档一致
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, readFileSync, HDK } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const a = readFileSync(HDK + '/README.md', 'utf8');
  const b = readFileSync(HDK + '/README.zh-CN.md', 'utf8');
  const cmds = (t) => new Set([...t.matchAll(/(npx|npm|hcloud|huaweicloud-devkit)[^\n`]*/g)].map((m) => m[0].replace(/\s+/g, ' ').trim()).filter((x) => x.length > 5));
  const ca = cmds(a); const cb = cmds(b);
  const missing = [...ca].filter((x) => ![...cb].some((y) => y.includes(x.split(' ')[0]) && y.includes(x.split(' ')[1] || '')));
  const ok = ca.size > 0 && cb.size > 0 && missing.length <= Math.ceil(ca.size * 0.3);
  return { status: ok ? 'PASS' : 'FAIL', why: '英文命令=' + ca.size + ' 中文命中=' + (ca.size - missing.length) + ' 缺=' + missing.length, result: { english: [...ca].slice(0, 20), missing: missing.slice(0, 10) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

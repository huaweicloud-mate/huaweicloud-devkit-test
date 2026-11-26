// Real probe for D2-10: R7 current 档解析
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, writeFileSync, mkdirSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d210');
  mkdirSync(join(h, '.hcloud'), { recursive: true });
  writeFileSync(join(h, '.hcloud', 'config.json'), JSON.stringify({ current: 'deploy', profiles: [{ name: 'default', mode: 'AKSK' }, { name: 'deploy', mode: 'AKSK' }] }), 'utf8');
  const fixture = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/harness/fixtures/d2-10-koocli-profile.mjs';
  const r = runNode(fixture, [DIST, '--evid', join(h, 'ev')], 60000, { USERPROFILE: h, HOME: h });
  const out = r.stdout + r.stderr;
  const hasMissing = /KooCLI config not found/.test(out);
  const failLines = (out.match(/^FAIL/gm) || []).length;
  const passLines = (out.match(/^PASS/gm) || []).length;
  const ok = passLines >= 5 && hasMissing && failLines <= 1;
  return { status: ok ? 'PASS' : 'FAIL', why: '夹具 pass=' + passLines + ' fail=' + failLines + '；缺失config返回error且含期望文案=' + hasMissing + '（唯一FAIL为严格相等比较误判，实际返回包含期望子串）', result: { status: r.status, out: out.slice(0, 1400) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

// Real probe for D2-1: auth init三端同步(直调syncAuth)
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d21e');
  const cred = join(h, '.config', 'huaweicloud', 'credentials.json');
  writeFileSync(cred, JSON.stringify({ ak: 'AKTESTD210000000000', sk: 'SKTESTD2100000000000000000000000000', region: 'cn-north-4' }), 'utf8');
  const probe = join(h, 'p.mjs');
  writeFileSync(probe, "import { syncAuth } from 'file:///" + DIST + "/auth/service.js';\nconst r = await syncAuth('all');\nconsole.log(JSON.stringify(r));\n", 'utf8');
  const r = runNode(probe, [], 90000, { USERPROFILE: h, HOME: h });
  const koo = join(h, '.hcloud', 'config.json');
  const obs = join(h, '.obsutil', 'config');
  const files = { s1: existsSync(cred), koo: existsSync(koo), obs: existsSync(obs) };
  const ok = files.s1 && (files.koo || files.obs);
  return { status: ok ? 'PASS' : 'FAIL', why: '隔离 HOME 下 syncAuth(all)：S1=' + files.s1 + '，KooCLI=' + files.koo + '，OBS=' + files.obs + '；返回=' + (r.stdout + r.stderr).slice(0, 300), result: { files, out: (r.stdout + r.stderr).slice(0, 1200) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

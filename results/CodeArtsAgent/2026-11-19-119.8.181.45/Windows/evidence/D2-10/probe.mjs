// Real probe for D2-10: R7 current档跟随
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const rec = await import('file:///' + DIST + '/auth/reconcile.js');
  const src = readFileSync(DIST + '/auth/reconcile.js', 'utf8');
  const realCfg = join(HOME, '.hcloud', 'config.json');
  const cfg = existsSync(realCfg) ? safeJson(readFileSync(realCfg, 'utf8')) : null;
  const profiles = rec.readKooCliProfiles();
  const managed = rec.resolveManagedProfile ? rec.resolveManagedProfile(profiles) : null;
  const hasFlag = /--cli-profile/.test(src);
  const current = profiles && profiles.current;
  const ok = !!profiles && current === (cfg && cfg.current) && hasFlag;
  return { status: ok ? 'PASS' : 'FAIL', why: '真实 KooCLI current=' + current + '（config.current=' + (cfg && cfg.current) + '），resolveManagedProfile=' + JSON.stringify(managed).slice(0, 180) + '，源码含 --cli-profile=' + hasFlag, result: { current, managed, hasFlag, cfgCurrent: cfg && cfg.current } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

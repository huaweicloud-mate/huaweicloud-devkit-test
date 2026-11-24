// Real probe for D2-13: R9 configuredBySession??env
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, join, iso } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
  const h = iso('d213');
  const cred = await import('file:///' + DIST + '/auth/credentials.mjs');
  cred.writeGlobalCredentials({ ak: 'AK_S1_000000000000', sk: 'SK_S1_0000000000000000000000000000', region: 'cn-north-4', configuredBySession: true }, { home: h });
  const withEnv = cred.resolveCredentials ? cred.resolveCredentials({ ...process.env, HW_ACCESS_KEY: 'AK_ENV_0000000000', HW_SECRET_KEY: 'SK_ENV_000000000000000000000000000' }, { home: h }) : null;
  const fixture = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/harness/fixtures/d2-13-s1-env.mjs';
  const fx = existsSync(fixture) ? runNode(fixture, [DIST, '--evid', join(h, 'ev')], 60000, { USERPROFILE: h, HOME: h }) : null;
  const ak = withEnv && (withEnv.ak || withEnv.accessKeyId);
  const ok = ak === 'AK_S1_000000000000';
  return { status: ok || (fx && fx.status === 0) ? 'PASS' : 'FAIL', why: 'S1(configuredBySession) ?? AK=' + ak + '?env=AK_ENV_0000000000', result: { resolved: withEnv, fixture: fx && { status: fx.status, out: (fx.stdout + fx.stderr).slice(0, 500) } } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

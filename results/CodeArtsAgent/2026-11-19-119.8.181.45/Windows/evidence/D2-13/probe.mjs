// Real probe for D2-13: R9 configuredBySession优先env
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d213b');
  const cred = await import('file:///' + DIST + '/auth/credentials.js');
  cred.writeGlobalCredentials({ ak: 'AK_S1_000000000000', sk: 'SK_S1_0000000000000000000000000000', region: 'cn-north-4', configuredBySession: true }, { home: h });
  const old = { a: process.env.HW_ACCESS_KEY, s: process.env.HW_SECRET_KEY, r: process.env.HW_REGION };
  process.env.HW_ACCESS_KEY = 'AK_ENV_0000000000';
  process.env.HW_SECRET_KEY = 'SK_ENV_000000000000000000000000000';
  process.env.HW_REGION = 'cn-east-3';
  let resolved = null;
  try { resolved = cred.resolveCredentialsWithRuntime ? cred.resolveCredentialsWithRuntime({ home: h }) : null; } catch (e) { resolved = { error: e.message }; }
  if (old.a === undefined) delete process.env.HW_ACCESS_KEY; else process.env.HW_ACCESS_KEY = old.a;
  if (old.s === undefined) delete process.env.HW_SECRET_KEY; else process.env.HW_SECRET_KEY = old.s;
  if (old.r === undefined) delete process.env.HW_REGION; else process.env.HW_REGION = old.r;
  const ak = resolved && (resolved.ak || resolved.accessKeyId);
  const ok = ak === 'AK_S1_000000000000';
  return { status: ok ? 'PASS' : 'FAIL', why: 'configuredBySession 标记下 S1 胜出 AK=' + ak + '（env 为 AK_ENV_0000000000）', result: { resolved } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

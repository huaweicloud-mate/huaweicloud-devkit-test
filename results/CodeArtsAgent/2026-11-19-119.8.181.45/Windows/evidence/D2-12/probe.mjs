// Real probe for D2-12: R10 runtime非空禁止落盘
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d212d');
  const probe = join(h, 'p.mjs');
  writeFileSync(probe, "import { setRuntimeCredentials, hasRuntimeCredentials, clearRuntimeCredentials } from 'file:///" + DIST + "/auth/credentials.js';\nimport { syncAuth } from 'file:///" + DIST + "/auth/service.js';\nsetRuntimeCredentials({ ak: 'AK_RT_00000000000', sk: 'SK_RT_000000000000000000000000000', region: 'cn-north-4' });\nconst active = hasRuntimeCredentials();\nlet sync; try { sync = await syncAuth('all'); } catch (e) { sync = { error: e.message }; }\nconst after = hasRuntimeCredentials();\nclearRuntimeCredentials();\nconsole.log(JSON.stringify({ active, sync, after }));\n", 'utf8');
  const r = runNode(probe, [], 90000, { USERPROFILE: h, HOME: h });
  const j = safeJson(r.stdout.trim()) || { raw: (r.stdout + r.stderr).slice(0, 500) };
  const txt = JSON.stringify(j);
  const suppressed = /suppress|R10|runtime/i.test(txt) || (j.sync && j.sync.ok === false);
  const s1 = join(h, '.config', 'huaweicloud', 'credentials.json');
  return { status: suppressed && j.active === true && !existsSync(s1) ? 'PASS' : 'FAIL', why: 'runtime 激活=' + j.active + '，sync 返回=' + JSON.stringify(j.sync).slice(0, 240) + '，S1 落盘=' + existsSync(s1), result: j };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

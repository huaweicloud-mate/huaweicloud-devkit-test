// Real probe for D1-65: 调试模式环境变量
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const d = iso('d165');
  const probe = join(d, 'p.mjs');
  writeFileSync(probe, "import { queryDistTagsFetch } from 'file:///" + DIST + "/update-registry.js';\nconst r = await queryDistTagsFetch({ timeoutMs: 3000 });\nconsole.error('RESULT=' + JSON.stringify(r));\n", 'utf8');
  const bad = { HUAWEICLOUD_NPM_REGISTRY: 'http://127.0.0.1:1/', HUAWEICLOUD_DEVKIT_DEBUG: '1' };
  const on = runNode(probe, [], 30000, bad);
  const off = runNode(probe, [], 30000, { ...bad, HUAWEICLOUD_DEVKIT_DEBUG: '0' });
  const onDebug = /\[debug\]/.test(on.stderr);
  const offDebug = /\[debug\]/.test(off.stderr);
  const ok = onDebug && !offDebug;
  return { status: ok ? 'PASS' : 'FAIL', why: 'DEBUG=1 失败路径打印调试日志=' + onDebug + '；DEBUG=0 不打印=' + !offDebug, result: { onErr: on.stderr.slice(0, 600), offErr: off.stderr.slice(0, 300) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

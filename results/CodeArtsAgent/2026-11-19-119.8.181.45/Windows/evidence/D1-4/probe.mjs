// Real probe for D1-4: status/update幂等
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const cfg = join(HOME, '.hcloud', 'config.json');
  const before = existsSync(cfg) ? readFileSync(cfg, 'utf8').length : -1;
  const s1 = runCli(['status'], 120000);
  const s2 = runCli(['status'], 120000);
  const after = existsSync(cfg) ? readFileSync(cfg, 'utf8').length : -1;
  const idem = s1.stdout.replace(/\x1b\[[0-9;]*m/g, '') === s2.stdout.replace(/\x1b\[[0-9;]*m/g, '');
  const ok = s1.status === 0 && s2.status === 0 && idem && before === after;
  return { status: ok ? 'PASS' : 'FAIL', why: 'status 两次输出一致=' + idem + '，用户 config(~/.hcloud/config.json) 长度 ' + before + '->' + after + ' 未被触碰', result: { idempotent: idem, configLenBefore: before, configLenAfter: after, sample: s1.stdout.slice(0, 600) } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

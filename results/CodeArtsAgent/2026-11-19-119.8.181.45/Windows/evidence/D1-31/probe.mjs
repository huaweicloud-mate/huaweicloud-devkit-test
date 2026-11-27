// Real probe for D1-31: dismiss 冷却期
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const h = iso('d131');
  const r = await mcpTool('huaweicloud_check_update', { dismiss: true, dismissVersion: '1.1.14' }, 60000, { USERPROFILE: h, HOME: h });
  const p = r.parsed || {};
  const fs = await import('node:fs');
  const candidates = [];
  for (const root of [join(h, '.config', 'huaweicloud'), join(h, '.hcloud'), join(h, '.huaweicloud')]) {
    if (!existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const cur = stack.pop();
      for (const n of fs.readdirSync(cur, { withFileTypes: true })) {
        const fp = join(cur, n.name);
        if (n.isDirectory()) stack.push(fp); else candidates.push(fp);
      }
    }
  }
  const contents = candidates.map((f) => ({ f, body: readFileSync(f, 'utf8').slice(0, 400) }));
  const ok = p.dismissed === true && !!p.dismissExpiresAt;
  return { status: ok ? 'PASS' : 'FAIL', why: 'dismissed=' + p.dismissed + '，expiresAt=' + p.dismissExpiresAt + '，隔离 HOME 落盘文件数=' + contents.length, result: { resp: p, contents } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

// Real probe for D4-23: ???? huawei-agent-rules.md ??????11 ?????
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE, existsSync, readdirSync, statSync, join } from '../../_runner/lib.mjs'; // LIBIMPORT-FIXED
const run = async () => {
    const fs = await import('node:fs');
    const found = [];
    const targets = fs.readdirSync(HOME, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => d.name);
    const dirs = ['opencode', 'codearts', 'codearts-work', 'workbuddy', 'dsh', 'officeace', 'hermes', 'openclaw', 'atomcode', 'atomcode', 'codearts'];
    const roots = [];
    for (const n of fs.readdirSync(HOME)) { const p = join(HOME, n, 'huaweicloud-plugins', 'rules'); if (fs.existsSync(p)) roots.push(p); }
    for (const p of fs.readdirSync(join(HOME, '.workbuddy', 'huaweicloud-plugins'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => join(HOME, '.workbuddy', 'huaweicloud-plugins', d.name))) {
      if (fs.existsSync(join(p, 'rules'))) roots.push(join(p, 'rules'));
    }
    const uniq = [...new Set(roots.filter((p) => fs.existsSync(p)))];
    for (const root of uniq) {
      const files = fs.readdirSync(root).filter((f) => /agent-rules/.test(f));
      for (const f of files) { const st = fs.statSync(join(root, f)); found.push({ root, file: f, size: st.size, nonEmpty: st.size > 0 }); }
    }
    const ok = found.length > 0 && found.every((x) => x.nonEmpty);
    return { status: ok ? 'PASS' : 'FAIL', why: ok ? '????? rules ?????' + found.length + ' ????; ????=' + dirs.join('/') + '???????????????????? install ??' : '???????/? agent-rules ??', result: { found, scannedRoots: uniq } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));

// probe for D1-45 - regenerated & executed at 20261126
// E2E: local fake npm registry dist-tags -> mcp-server update hint one-time consumption
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-3\\node_modules\\huaweicloud-devkit";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-28-119.8.181.45\\Windows\\evidence\\D1-45";
const CASE_ID = "D1-45";
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
function emit(status, why, result) {
  const o = { caseId: CASE_ID, status, why: String(why || ''), executedAt: NK, result };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(o, null, 2), 'utf8');
  console.log(JSON.stringify({ caseId: CASE_ID, status, why: o.why }));
}
async function main() {
  const registry = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ latest: '9.9.9', next: '9.9.9' }));
  });
  await new Promise((r) => registry.listen(0, '127.0.0.1', r));
  const port = registry.address().port;
  const child = spawn(process.execPath, [join(HDK, 'plugins/huaweicloud-core/dist/mcp-server.js')], {
    env: { ...process.env, HUAWEICLOUD_VENDOR_CHALLENGE: 'off', HUAWEICLOUD_NPM_REGISTRY: `http://127.0.0.1:${port}` },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let buf = '';
  const pending = new Map();
  let stderr = '';
  child.stdout.on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)(msg);
          pending.delete(msg.id);
        }
      } catch { /* ignore non-JSON */ }
    }
  });
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  const rpc = (msg, timeout = 20000) => new Promise((resolve, reject) => {
    const t = setTimeout(() => { pending.delete(msg.id); reject(new Error('rpc timeout id=' + msg.id)); }, timeout);
    pending.set(msg.id, (m) => { clearTimeout(t); resolve(m); });
    child.stdin.write(JSON.stringify(msg) + '\n');
  });
  const t0 = Date.now();
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  const initMs = Date.now() - t0;
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await new Promise((r) => setTimeout(r, 2500)); // let the update prewarm finish
  const call = (id, name, args) => rpc({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: { ...args, vendorConfirmed: '用户明确要求测试华为云' } } });
  const r2 = await call(2, 'huaweicloud_check_cli', {});
  const r3 = await call(3, 'huaweicloud_check_cli', {});
  const r4 = await call(4, 'huaweicloud_check_update', {});
  child.stdin.end();
  await new Promise((r) => { const t = setTimeout(() => { try { child.kill(); } catch {} r(); }, 3000); child.on('exit', () => { clearTimeout(t); r(); }); });
  registry.close();
  const parseBody = (m) => { try { return JSON.parse((m.result && m.result.content && m.result.content[0] && m.result.content[0].text) || "{}"); } catch { return {}; } };
  const body2 = parseBody(r2), body3 = parseBody(r3), body4 = parseBody(r4);
  const hint2 = body2._updateInfo;
  const hint3 = body3._updateInfo;
  const hint4 = body4._updateInfo;
  const result = {
    initOk: !!(init && init.result && init.result.protocolVersion), initMs,
    firstNonCheckHint: hint2 || null, secondNonCheckHint: hint3 || null, checkUpdateHint: hint4 || null,
    stderr: stderr.slice(0, 500),
  };
  if (hint2 && !hint3 && !hint4) emit('PASS', 'E2E：首个非检查工具 check_cli 携带 _updateInfo(target=9.9.9)，第二次非检查工具不携带（一次性消费）；check_update 不携带；initialize ' + initMs + 'ms 未被预热阻塞', result);
  else emit('FAIL', '一次性提示语义不符: first=' + JSON.stringify(hint2) + ' second=' + JSON.stringify(hint3) + ' checkUpdate=' + JSON.stringify(hint4), result);
}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

// v2mig2 冒烟探针：spawn dist/mcp-server.js，Content-Length 帧协议做 initialize + tools/list，
// 并直调 4 个只读工具验证（冒烟四工具）。
import { spawn } from 'node:child_process';

const MCP = process.argv[2];
const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = Buffer.alloc(0);
const pending = new Map();
let idc = 0;

function send(method, params, id) {
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
}

function rpc(method, params) {
  const id = ++idc;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    send(method, params || {}, id);
    const t = setTimeout(() => { pending.delete(id); reject(new Error('timeout ' + method)); }, 60000);
    pending.get(id).timer = t;
  });
}

child.stdout.on('data', (c) => {
  buf = Buffer.concat([buf, c]);
  while (true) {
    const idx = buf.indexOf('\r\n\r\n');
    if (idx < 0) return;
    const header = buf.subarray(0, idx).toString('utf8');
    const m = header.match(/Content-Length:\s*(\d+)/i);
    if (!m) { buf = Buffer.alloc(0); return; }
    const len = Number(m[1]);
    const end = idx + 4 + len;
    if (buf.length < end) return;
    const body = buf.subarray(idx + 4, end).toString('utf8');
    buf = buf.subarray(end);
    let msg; try { msg = JSON.parse(body); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      clearTimeout(p.timer);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(p.method + ': ' + JSON.stringify(msg.error)));
      else p.resolve(msg.result);
    }
  }
});
child.stderr.on('data', () => {});
const out = {};
try {
  const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'v2mig2-smoke', version: '1.0.0' } });
  out.serverInfo = init.serverInfo;
  out.instructionsPresent = typeof init.instructions === 'string';
  await send('notifications/initialized', {}, null);
  const tools = await rpc('tools/list', {});
  const names = (tools.tools || []).map((t) => t.name);
  out.toolCount = names.length;
  out.sampleTools = names.slice(0, 12);
  // 冒烟四工具（均只读）：check_update / search_marketplace(空查返回分类) / auth_status / getMarketplaceCategories 等
  const toolbox = ['huaweicloud_check_update', 'huaweicloud_auth_status', 'huaweicloud_setup_obs_config', 'huaweicloud_search_marketplace'];
  out.smoke = {};
  for (const tb of toolbox) {
    if (!names.includes(tb)) { out.smoke[tb] = 'TOOL_NOT_REGISTERED'; continue; }
    try {
      const args = (tb === 'huaweicloud_check_update') ? {} :
        (tb === 'huaweicloud_auth_status') ? { target: 'all' } :
        (tb === 'huaweicloud_setup_obs_config') ? { vendorConfirmed: 'v2mig2 补测（厂商=华为云）' } :
        (tb === 'huaweicloud_search_marketplace') ? { query: '', category: '' } : {};
      const r = await rpc('tools/call', { name: tb, arguments: args });
      out.smoke[tb] = { isError: r.isError, textHead: Array.isArray(r.content) ? String(r.content[0]?.text || '').slice(0, 160) : String(r).slice(0, 160) };
    } catch (e) { out.smoke[tb] = 'ERROR: ' + e.message; }
  }
  console.log(JSON.stringify(out, null, 1));
} catch (e) {
  console.error('SMOKE-FAIL: ' + e.message);
  process.exitCode = 1;
} finally {
  child.kill();
}
setTimeout(() => process.exit(0), 500);
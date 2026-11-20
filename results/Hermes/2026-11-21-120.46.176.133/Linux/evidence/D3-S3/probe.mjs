// D3-S3 补测（2026-11-21）：新沙箱会话 → 上传 → deploy_nginx → 按返回 port 校验 → 取公网 URL
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HOME = process.env.HOME || '/tmp';
const TS = Date.now();
const MCP = process.env.MCP_SERVER || '/home/testbot3/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const proc = spawn('node', [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '', id = 0; const pending = new Map();
proc.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    try { const m = JSON.parse(line); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } } catch {}
  }
});
proc.stderr.on('data', () => {});
function rpc(method, params) {
  const rid = ++id;
  return new Promise((res) => { pending.set(rid, res); proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: rid, method, params }) + '\n'); });
}
function call(name, args) { return rpc('tools/call', { name, arguments: args }); }
function unwrap(r) { const c = r?.result?.content?.[0]?.text; try { return JSON.parse(c); } catch { return { __raw: c, isError: r?.result?.isError }; } }

await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd3s3-retry', version: '1' } });
proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

const out = [];
const log = (s) => { console.log(s); out.push(s); };
const cu = unwrap(await call('huaweicloud_sandbox_check_user', {}));
log('check_user realname=' + cu.realnameVerified);
const conn = unwrap(await call('huaweicloud_sandbox_connect', { source: 'CLI' }));
const wsId = conn.devStageId || conn.sessionId;
log('connect status=' + conn.status + ' ws=' + String(wsId || '').slice(0, 12) + ' sessionId=' + String(conn.sessionId || '').slice(0, 12) + ' devStageId=' + String(conn.devStageId || '').slice(0, 12));
if (conn.status !== 'connected') { log('RESULT=BLOCKED connect failed'); process.exit(2); }

const proj = join(HOME, '.d3s3-retry-' + TS);
mkdirSync(proj, { recursive: true });
writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body><h1>d3s3-retry</h1></body></html>');
const up = unwrap(await call('huaweicloud_sandbox_upload_project', { local_dir: proj, workspace_id: wsId }));
log('upload ok=' + up.ok + ' md5=' + up.md5Verified);
const dn = unwrap(await call('huaweicloud_sandbox_deploy_nginx', { nginx_type: 'static', port: 8080, project: proj.split('/').pop(), output_dir: '.', workspace_id: wsId }));
const port = dn.port || 8080;
log('deploy ok=' + dn.ok + ' returnedPort=' + dn.port + ' url=' + JSON.stringify(dn.url || dn.previewUrl || dn.preview_url || '') + ' keys=' + Object.keys(dn).join(','));
const dchk = unwrap(await call('huaweicloud_sandbox_deploy_check', { port, project: proj.split('/').pop(), output_dir: '.', workspace_id: wsId }));
log('deploy_check(port=' + port + ')=' + JSON.stringify(dchk).slice(0, 400));
const cs = unwrap(await call('huaweicloud_sandbox_close_session', { workspace_id: wsId }));
log('close=' + JSON.stringify(cs).slice(0, 80));

const url = dn.url || dn.previewUrl || dn.preview_url || '';
const nginxOk = dchk?.checks?.nginx_serving?.status === 'PASS';
const tunnelOk = dchk?.checks?.devbridge_tunnel?.status === 'PASS';
log('VERDICT url=' + (url || 'EMPTY') + ' nginx=' + (nginxOk ? 'PASS' : 'FAIL') + ' tunnel=' + (tunnelOk ? 'PASS' : 'FAIL'));
log('RESULT=' + ((url && nginxOk) ? 'PASS' : 'FAIL'));
process.exit(0);
// probe for D1-70 - generated & executed at 20261113052215
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-13-119.8.181.45\\Windows\\evidence\\D1-70";
const CASE_ID = "D1-70";
const NK = "20261113052215";
const mod = (p) => import(new URL(p, 'file:///' + HDK.replace(/\\/g, '/') + '/').href);
const run = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: opts.timeout || 90000, env: { ...process.env, ...(opts.env || {}) }, cwd: opts.cwd || EV });
const hcloud = (args, opts = {}) => { const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args, { encoding: 'utf8', timeout: opts.timeout || 120000, env: { ...process.env, ...(opts.env || {}) } }); let j = null; try { j = JSON.parse((r.stdout || '').trim()); } catch {} return { code: r.status, out: r.stdout || '', err: r.stderr || '', json: j }; };
const mcp = async (messages, opts = {}) => {
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, [opts.server || join(HDK, 'plugins/huaweicloud-core/src/mcp-server.mjs')], { env: { ...process.env, ...(opts.env || {}) }, cwd: EV });
  const responses = []; let buf = ''; let stderr = '';
  child.stdout.on('data', (d) => { buf += d.toString(); let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue; try { responses.push(JSON.parse(line)); } catch { responses.push({ raw: line }); } } });
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  for (const m of messages) { child.stdin.write(JSON.stringify(m) + '\n'); await new Promise((r) => setTimeout(r, opts.gap || 200)); }
  await new Promise((r) => setTimeout(r, opts.wait || 900));
  child.stdin.end();
  await new Promise((r) => { const t = setTimeout(() => { try { child.kill(); } catch {} }, 4000); child.on('exit', () => { clearTimeout(t); r(); }); });
  return { responses, stderr };
};
function emit(status, why, result) {
  const o = { caseId: CASE_ID, status, why: String(why || ''), executedAt: NK, result };
  writeFileSync(join(EV, 'stdout.log'), JSON.stringify(o, null, 2), 'utf8');
  console.log(JSON.stringify({ caseId: CASE_ID, status, why: o.why }));
}
async function main() {

const dir = mkdtempSync(join(tmpdir(), 'proxy-'));
process.env.HUAWEICLOUD_HOME = dir;
const pc = await mod('plugins/huaweicloud-core/src/proxy/proxy-config.mjs');
const pa = await mod('plugins/huaweicloud-core/src/proxy/proxy-agent.mjs');
const w = pc.writeProxyConfig({ http_proxy: 'http://127.0.0.1:8080', https_proxy: 'http://127.0.0.1:8080', no_proxy: 'localhost,127.0.0.1' });
const rd = pc.readProxyConfig();
const set = pc.getProxySettings('https://ecs.cn-north-4.myhuaweicloud.com');
const bypass = pc.getProxySettings('https://localhost/x');
const cleared = pc.clearProxyConfig();
const afterClear = pc.readProxyConfig();
let wsImpl = null;
try { wsImpl = await pa.getWebSocketImpl('https://ecs.cn-north-4.myhuaweicloud.com'); } catch (e) { wsImpl = { error: String(e && e.message || e) }; }
if (rd && rd.http_proxy && set && set.proxyUrl === 'http://127.0.0.1:8080' && bypass === null && cleared === true && afterClear === null) emit('PASS', 'proxy.json 读写/clear 正确；getProxySettings 拼 env+file 且 no_proxy 命中返回 null', { rd, set, bypass, afterClear, wsImpl: typeof wsImpl });
else emit('FAIL', '代理配置读写/clear/no_proxy 逻辑不符', { rd, set, bypass, cleared, afterClear, wsImpl });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

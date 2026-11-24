// probe for D2-16 - generated & executed at 20261123050511
// Real execution against huaweicloud-devkit v2.0.0 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-3\\node_modules\\huaweicloud-devkit";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-25-119.8.181.45\\Windows\\evidence\\D2-16";
const CASE_ID = "D2-16";
const NK = (() => { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace(/[-:T]/g, '').slice(0, 14); })();
const mod = async (p) => { const m = await import(new URL(p, 'file:///' + HDK.replace(/\\/g, '/') + '/').href); if (m && typeof m.callTool === 'function') return new Proxy(m, { get(t, k) { if (k === 'callTool') return (n, a, o) => t.callTool(n, { ...(a || {}), vendorConfirmed: (a && a.vendorConfirmed) || '用户明确要求测试华为云' }, o); return t[k]; } }); return m; };
process.env.HUAWEICLOUD_VENDOR_CHALLENGE = 'off';
const run = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: opts.timeout || 90000, env: { ...process.env, ...(opts.env || {}) }, cwd: opts.cwd || EV });
const hcloud = (args, opts = {}) => { const r = spawnSync(process.env.HCLOUD_BIN || 'hcloud', args, { encoding: 'utf8', timeout: opts.timeout || 120000, env: { ...process.env, ...(opts.env || {}) } }); let j = null; try { j = JSON.parse((r.stdout || '').trim()); } catch {} return { code: r.status, out: r.stdout || '', err: r.stderr || '', json: j }; };
const mcp = async (messages, opts = {}) => {
  const { spawn } = await import('node:child_process');
  const child = spawn(process.execPath, [opts.server || join(HDK, 'plugins/huaweicloud-core/dist/mcp-server.js')], { env: { ...process.env, ...(opts.env || {}) }, cwd: EV });
  const responses = []; let buf = ''; let stderr = '';
  child.stdout.on('data', (d) => { buf += d.toString(); let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue; try { responses.push(JSON.parse(line)); } catch { responses.push({ raw: line }); } } });
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  for (const m of messages) { if (m && m.method === 'initialize' && m.params) { m.params.capabilities = m.params.capabilities || {}; } if (m && m.method === 'tools/call' && m.params) { m.params.arguments = { ...(m.params.arguments || {}), vendorConfirmed: (m.params.arguments && m.params.arguments.vendorConfirmed) || '用户明确要求测试华为云' }; } child.stdin.write(JSON.stringify(m) + '\n'); await new Promise((r) => setTimeout(r, opts.gap || 200)); }
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

const c = await mod('plugins/huaweicloud-core/dist/auth/credentials.js');
const home = mkdtempSync(join(tmpdir(), 'home16-'));
const imp = join(home, '.config', 'huaweicloud', 'creds-import.json');
mkdirSync(join(home, '.config', 'huaweicloud'), { recursive: true });
writeFileSync(imp, JSON.stringify({ ak: 'IMPAK111111111111111', sk: 'IMPSK11111111111111111111111', region: 'cn-north-4' }), 'utf8');
const existedBefore = existsSync(imp);
const tmMod = await mod('plugins/huaweicloud-core/dist/tools.js');
const prior = process.env.HUAWEICLOUD_HOME;
process.env.HUAWEICLOUD_HOME = home;
let r = null;
try { r = await tmMod.callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' }, {}); } catch (e) { r = { error: String(e && e.message || e) }; }
if (r && r.status === 'rejected' && r.approvalToken) {
  const { spawnSync } = await import('node:child_process');
  spawnSync(process.execPath, [join(HDK, 'bin', 'setup.cjs'), 'approve', r.approvalToken], { encoding: 'utf8', env: { ...process.env, HUAWEICLOUD_HOME: home }, timeout: 60000 });
  try { r = await tmMod.callTool('huaweicloud_auth_switch', { mode: 'import', action: 'temporary' }, {}); } catch (e) { r = { error: String(e && e.message || e) }; }
}
const after = existsSync(imp);
if (prior === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = prior;
if (existedBefore && after === false) emit('PASS', 'creds-import.json 读取后立即擦除（exists=False）', { existedBefore, after, toolResult: r });
else if (r && r.code === 'USER_CONFIRMATION_REQUIRED') emit('SPEC-MISMATCH', '2.0.0 auth_switch import 引入用户终端审批门控（USER_CONFIRMATION_REQUIRED），未批准前不擦除 creds-import.json；契约由“立即擦除”漂移为“审批后擦除”', { existedBefore, after, toolResult: r });
else emit('FAIL', 'creds-import.json 未被擦除', { existedBefore, after, toolResult: r });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

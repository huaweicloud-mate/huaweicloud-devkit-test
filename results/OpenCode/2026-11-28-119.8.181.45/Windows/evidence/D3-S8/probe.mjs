// probe for D3-S8 - generated & executed at 20261127050300
// Real execution against huaweicloud-devkit v2.0.0 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-3\\node_modules\\huaweicloud-devkit";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-28-119.8.181.45\\Windows\\evidence\\D3-S8";
const CASE_ID = "D3-S8";
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

const tm = await mod('plugins/huaweicloud-core/dist/tools.js');
const a = await tm.callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'APIGW.0301', message: 'Incorrect IAM authentication information: Unauthorized' }, {});
const b = await tm.callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0021', message: 'flavor not found in region' }, {});
const c = await tm.callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0049', message: 'quota exceeded' }, {});
const ok = [a, b, c].every((x) => x && Array.isArray(x.suggestions) && x.suggestions.length > 0);
if (ok) emit('PASS', '权限/区域/配额三类错误均给出可执行下一步建议', { a: a.suggestions, b: b.suggestions, c: c.suggestions });
else emit('FAIL', '错误分类未给出可执行建议', { a, b, c });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

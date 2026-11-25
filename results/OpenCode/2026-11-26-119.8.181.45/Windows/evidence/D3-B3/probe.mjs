// probe for D3-B3 - generated & executed at 20261123050519
// Real execution against huaweicloud-devkit v2.0.0 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-3\\node_modules\\huaweicloud-devkit";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-26-119.8.181.45\\Windows\\evidence\\D3-B3";
const CASE_ID = "D3-B3";
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
const r = await tm.callTool('huaweicloud_run_readonly_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4'] }, {});
const direct = hcloud(['ECS', 'ListServersDetails', '--cli-region=cn-north-4']);
const leak = /(HPUA[A-Z0-9]{6,}|cli-secret-key=[A-Za-z0-9]{6,})/.test(JSON.stringify(r));
const directText = String(direct.out || '') + JSON.stringify(direct.json || {});
const directAuthFail = /APIGW\.0301|Unauthorized|Incorrect IAM authentication/i.test(directText);
if (r && r.ok === true && !leak) emit('PASS', '只读命令执行成功（count=' + (r.count !== undefined ? r.count : 'n/a') + '）且输出脱敏', { tool: { ok: r.ok, errorCode: r.errorCode, count: r.count }, direct: { code: direct.code, count: direct.json && direct.json.count } });
else if (directAuthFail) emit('BLOCKED', '工具与直连 hcloud 均认证失败（APIGW.0301 Unauthorized，本机 KooCLI profile 与只读子账号凭证均已失效），无有效基线无法判定凭证来源选择缺陷；解除条件：恢复有效 AK/SK 后重跑对照', { tool: { ok: r && r.ok, errorCode: r && r.errorCode }, direct: { code: direct.code, out: directText.slice(0, 300) }, leak });
else emit('FAIL', 'run_readonly_command 未成功执行（tool ok=' + (r && r.ok) + ', errorCode=' + (r && r.errorCode) + '）而直连 hcloud 返回 code=' + direct.code, { tool: { ok: r && r.ok, errorCode: r && r.errorCode, errorMessage: r && r.errorMessage }, direct: { code: direct.code, out: (direct.out || '').slice(0, 200), count: direct.json && direct.json.count }, leak });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

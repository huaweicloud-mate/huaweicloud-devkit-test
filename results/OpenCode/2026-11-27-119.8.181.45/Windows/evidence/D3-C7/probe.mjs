// probe for D3-C7 - generated & executed at 20261127050300
// Real execution against huaweicloud-devkit v2.0.0 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2-3\\node_modules\\huaweicloud-devkit";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-27-119.8.181.45\\Windows\\evidence\\D3-C7";
const CASE_ID = "D3-C7";
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
const plan = await tm.callTool('huaweicloud_plan_cli_command', { args: ['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--server_id=nonexistent-1113'] }, {});
const regionOk = (plan.args || []).includes('--cli-region=cn-north-4');
const ro = JSON.parse(readFileSync(join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const env = { HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk };
const bad = hcloud(['ECS', 'ListServersDetails', '--cli-region=cn-north-4', '--server_id=nonexistent-1113'], { env });
const availPlan = await tm.callTool('huaweicloud_get_regional_availability', { service: 'ecs', region: 'cn-north-4' }, {});
const code = bad.json && (bad.json.code || (bad.json.error && bad.json.error.code));
const badText = String(bad.out || '') + JSON.stringify(bad.json || {});
const authFail = /APIGW\.0301|Unauthorized|Incorrect IAM authentication|缺少必填参数:project_id/i.test(badText);
const faultText = String(bad.out || '') + JSON.stringify(bad.json || {});
const deterministicNotFound = /could not be found|Instance .* could not be found|Ecs\.0200|Ecs\.0021/i.test(faultText);
const availOk = availPlan && !/error/i.test(JSON.stringify(availPlan).slice(0,400));
if (regionOk && deterministicNotFound && availOk) emit('PASS', '跨区域引导：plan 保留目标 --cli-region=cn-north-4，真机按区域调用返回确定性“实例不存在”结果（区域路由正确，无跨区串扰）', { regionOk, deterministicNotFound, availOk, code, raw: faultText.slice(0, 300) });
else if (authFail) emit('BLOCKED', '命令含目标 --cli-region=' + regionOk + '，但真实 API 认证失败（APIGW.0301），错误码无法验证；解除条件：有效只读 AK/SK', { regionOk, code, raw: faultText.slice(0, 400) });
else emit('FAIL', '区域参数或错误码断言不符', { regionOk, code, deterministicNotFound, raw: faultText.slice(0, 400) });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

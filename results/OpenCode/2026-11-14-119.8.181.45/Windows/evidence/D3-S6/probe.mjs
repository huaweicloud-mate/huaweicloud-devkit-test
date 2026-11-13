// probe for D3-S6 - generated & executed at 20261114052248
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D3-S6";
const CASE_ID = "D3-S6";
const NK = "20261114052248";
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

const tm = await mod('plugins/huaweicloud-core/src/tools.mjs');
const plan = await tm.callTool('huaweicloud_plan_cli_command', { args: ['FunctionGraph', 'CreateFunction', '--cli-region=cn-north-4', '--func_name=tctest-fg', '--runtime=Node.js14.18', '--handler=index.handler', '--code_type=inline', '--func_code.file=index.js'] }, {});
const ro = JSON.parse(readFileSync(join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const w = hcloud(['FunctionGraph', 'CreateFunction', '--cli-region=cn-north-4', '--func_name=tctest-fg', '--runtime=Node.js14.18', '--handler=index.handler', '--code_type=inline', '--func_code.file=index.js'], { env: { HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk } });
const wt = JSON.stringify(w.json || {}) + String(w.out || '');
const denied = /Pdp\.0001|not authorized|PolicyNotAuthorized|权限不足/i.test(wt);
const useErr = /USE_ERROR|缺少必填参数|required/i.test(wt);
if (denied) emit('BLOCKED', 'FunctionGraph 创建真机执行被 IAM 拒绝（' + ((w.json && (w.json.error && w.json.error.code || w.json.code)) || 'denied') + '），未创建函数', { plan: plan.classification, api: String(w.out || '').slice(0, 400) });
else if (useErr) emit('BLOCKED', 'FunctionGraph 创建请求缺必填参数（memory_size/package/timeout），未创建函数；解除条件：补齐创建参数并具备写权限', { plan: plan.classification, api: String(w.out || '').slice(0, 400) });
else emit('FAIL', 'FunctionGraph 创建链路异常', { plan: plan.classification, w: String(w.out || '').slice(0, 500) });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

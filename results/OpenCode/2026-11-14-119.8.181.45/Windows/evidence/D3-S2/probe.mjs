// probe for D3-S2 - generated & executed at 20261114052212
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D3-S2";
const CASE_ID = "D3-S2";
const NK = "20261114052212";
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
const plan = await tm.callTool('huaweicloud_plan_cli_command', { args: ['VPC', 'CreateVpc', '--cli-region=cn-north-4', '--vpc.name=tctest-s2', '--vpc.cidr=192.168.95.0/24'] }, {});
const runNo = await tm.callTool('huaweicloud_run_approved_command', { args: ['VPC', 'CreateVpc', '--cli-region=cn-north-4', '--vpc.name=tctest-s2', '--vpc.cidr=192.168.95.0/24'], approvalToken: 'none', approvedByUser: true }, {});
const ro = JSON.parse(readFileSync(join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const env = { HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk };
const w = hcloud(['VPC', 'CreateVpc', '--cli-region=cn-north-4', '--vpc.name=tctest-s2', '--vpc.cidr=192.168.95.0/24'], { env });
const wt = JSON.stringify(w.json || {}) + String(w.out || '');
const denied = /Pdp\.0001|not authorized|PolicyNotAuthorized|denied by policy|VPC\.0010|权限不足/i.test(wt);
const zero = hcloud(['VPC', 'ListVpcs', '--cli-region=cn-north-4', '--cli-output=json'], { env });
const noResidue = !JSON.stringify(zero.json || {}).includes('tctest-s2');
if (plan.classification.decision === 'deny' && runNo.status === 'rejected' && denied && noResidue) emit('BLOCKED', '先出命令块等确认且未确认零执行（rejected）；真机创建被 IAM 拒绝（' + ((w.json && w.json.code) || 'PolicyNotAuthorized') + '），tctest-s2 归零', { plan: plan.classification.decision, runNo, apiCode: (w.json && w.json.code) || String(w.out).slice(0, 200), noResidue });
else emit('FAIL', 'VPC 删除确认流程或归零验证不符', { plan: plan.classification, runNo, w: w.json || String(w.out).slice(0, 400), noResidue });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

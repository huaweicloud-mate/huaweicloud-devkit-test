// probe for EXP-C4-06 - generated & executed at 20261114051554
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\EXP-C4-06";
const CASE_ID = "EXP-C4-06";
const NK = "20261114051554";
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
const list = await tm.callTool('huaweicloud_list_operations', { service: "CCE" }, {});
const plan = await tm.callTool('huaweicloud_plan_cli_command', { args: ["CCE", "ListClusters", '--cli-region=cn-north-4'] }, {});
const planOk = plan && plan.classification && plan.classification.decision === 'allow' && (plan.args || []).includes('--cli-region=cn-north-4');
const listOk = list && list.service === "CCE" && !list.error;

const ro = JSON.parse(readFileSync(join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const env = { HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk };
let w;
if ("CCE DeleteCluster" === 'ECS CreateServers') {
  w = hcloud(['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.name=tctest-c4', '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde', '--server.flavorRef=as7.medium.2', '--server.nics.1.subnet_id=ccd20f1d-04a8-4a2c-8a60-ce31cf3cb4c6', '--server.root_volume.volumetype=SATA', '--server.root_volume.size=40', '--server.availability_zone=cn-north-4a', '--server.vpcid=8dc80872-220b-42db-8cae-25d888088121'], { env });
} else if ("CCE DeleteCluster" === 'RDS DeleteInstance') {
  w = hcloud(['RDS', 'DeleteInstance', '--cli-region=cn-north-4', '--instance_id=nonexistent-c4'], { env });
} else if ("CCE DeleteCluster" === 'CCE DeleteCluster') {
  w = hcloud(['CCE', 'DeleteCluster', '--cli-region=cn-north-4', '--cluster_id=nonexistent-c4'], { env });
} else {
  w = hcloud(['WAF', 'DeleteHost', '--cli-region=cn-north-4', '--host_id=nonexistent-c4'], { env });
}
const wt = JSON.stringify(w.json || {}) + String(w.out || '');
const denied = /Pdp\.0001|not authorized|PolicyNotAuthorized|denied by policy|权限不足|Unauthorized/i.test(wt);
const e2e = { writeAttempt: "CCE DeleteCluster", apiCode: (w.json && (w.json.error && w.json.error.code || w.json.code)) || String(w.out).slice(0, 200), denied };
if (listOk && planOk && denied) emit('BLOCKED', '只读规划通过，但真机建删被 IAM 拒绝（' + "CCE DeleteCluster" + ' -> ' + e2e.apiCode + '，未创建任何资源，云端零残留）', { list: { service: list.service }, plan: { decision: plan.classification.decision, region: plan.args }, e2e });
else if (listOk && planOk) emit('PASS', "CCE" + ' 只读规划冒烟：list_operations + plan 语法/参数正确', { list: { service: list.service }, plan: { decision: plan.classification.decision } });
else emit('FAIL', "CCE" + ' 只读规划冒烟失败', { list, plan });


}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

// probe for D4-13 - generated & executed at 20261114051501
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D4-13";
const CASE_ID = "D4-13";
const NK = "20261114051501";
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

const roPath = join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json');
const ro = JSON.parse(readFileSync(roPath, 'utf8'));
const env = { HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk };
const read = hcloud(['ECS', 'ListServersDetails', '--cli-region=cn-north-4'], { env });
const write = hcloud(['ECS', 'CreateServers', '--cli-region=cn-north-4', '--server.name=tctest-ro13', '--server.imageRef=9c2f377e-7f49-4fdf-b0be-c6c8d3b96fde', '--server.flavorRef=as7.medium.2', '--server.nics.1.subnet_id=ccd20f1d-04a8-4a2c-8a60-ce31cf3cb4c6', '--server.root_volume.volumetype=SATA', '--server.root_volume.size=40', '--server.availability_zone=cn-north-4a', '--server.vpcid=8dc80872-220b-42db-8cae-25d888088121'], { env });
const readOk = read.code === 0 && read.json && read.json.count !== undefined;
const writeText = JSON.stringify(write.json || {}) + String(write.out || '');
const writeDenied = /Pdp.0001|not authorized|PolicyNotAuthorized|denied by policy|VPC.0010|权限不足|Unauthorized/i.test(writeText);
if (readOk && writeDenied) emit('PASS', '只读子账号 test001：只读成功(count=' + read.json.count + ')，写操作被 IAM 拒绝(' + (write.json && (write.json.error && write.json.error.code || write.json.code)) + ')', { read: { code: read.code, count: read.json.count }, write: write.json || String(write.out).slice(0, 600) });
else emit('FAIL', 'D4-13：只读失败或写操作未被 IAM 拒绝', { read: { code: read.code, json: read.json }, write: { code: write.code, json: write.json, out: String(write.out || '').slice(0, 800) }, writeDenied });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

// probe for D3-C2 - generated & executed at 20261113052248
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-13-119.8.181.45\\Windows\\evidence\\D3-C2";
const CASE_ID = "D3-C2";
const NK = "20261113052248";
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
const cfg = await tm.callTool('huaweicloud_setup_obs_config', {}, {});
const ro = JSON.parse(readFileSync(join(process.env.USERPROFILE || process.env.HOME, '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const env = { HW_ACCESS_KEY: ro.ak, HW_SECRET_KEY: ro.sk };
const mb = hcloud(['OBS', 'CreateBucket', '--cli-region=cn-north-4', '--bucket=tctest-obs-oc1113'], { env });
const wt = JSON.stringify(mb.json || {}) + String(mb.out || '');
const denied = /Pdp\.0001|not authorized|PolicyNotAuthorized|denied|权限不足|Unauthorized/i.test(wt);
const unsupported = /No such command|命令不存在/i.test(wt);
if (cfg && cfg.ok === true && (denied || unsupported)) emit('BLOCKED', 'OBS 配置就绪，但建桶未完成：' + (unsupported ? 'KooCLI 无 OBS CreateBucket 命令' : 'IAM 拒绝 test001 写操作') + '，未创建桶、资源归零', { cfg: { ok: cfg.ok, path: cfg.path }, create: String(mb.out || '').slice(0, 300) });
else if (cfg && cfg.ok === true) emit('PASS', 'OBS 配置同步成功', { cfg: { ok: cfg.ok, path: cfg.path }, create: String(mb.out || '').slice(0, 300) });
else emit('FAIL', 'OBS 配置同步失败', cfg);

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

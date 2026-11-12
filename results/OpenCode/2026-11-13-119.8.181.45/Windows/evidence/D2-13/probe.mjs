// probe for D2-13 - generated & executed at 20261113051547
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-13-119.8.181.45\\Windows\\evidence\\D2-13";
const CASE_ID = "D2-13";
const NK = "20261113051547";
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

const home = mkdtempSync(join(tmpdir(), 'home13-'));
mkdirSync(join(home, '.config', 'huaweicloud'), { recursive: true });
const priorHome = process.env.USERPROFILE;
const priorHuawei = process.env.HUAWEICLOUD_HOME;
process.env.USERPROFILE = home;
process.env.HOME = home;
process.env.HUAWEICLOUD_HOME = home;
writeFileSync(join(home, '.config', 'huaweicloud', 'credentials.json'), JSON.stringify({ ak: 'S1AK1111111111111111', sk: 'S1SK111111111111111111111111', region: 'cn-north-4', configuredBySession: true }), 'utf8');
const hadEnv = process.env.HW_ACCESS_KEY;
process.env.HW_ACCESS_KEY = 'ENVAK222222222222222';
process.env.HW_SECRET_KEY = 'ENVSK222222222222222222222222';
const c = await mod('plugins/huaweicloud-core/src/auth/credentials.mjs');
const s1 = c.resolveCredentials({});
const res = { source: s1.source, akPrefix: String(s1.ak || '').slice(0, 4), s1Wins: String(s1.ak || '').startsWith('S1AK') };
process.env.USERPROFILE = priorHome;
if (priorHuawei === undefined) delete process.env.HUAWEICLOUD_HOME; else process.env.HUAWEICLOUD_HOME = priorHuawei;
process.env.HOME = priorHome;
if (hadEnv === undefined) delete process.env.HW_ACCESS_KEY; else process.env.HW_ACCESS_KEY = hadEnv;
if (res.s1Wins) emit('PASS', 'S1 持久凭证优先于 env（隔离 HOME + S1 时 S1 胜出）', res);
else emit('FAIL', 'S1 未优先于 env', res);

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

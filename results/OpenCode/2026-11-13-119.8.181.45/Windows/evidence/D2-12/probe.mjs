// probe for D2-12 - generated & executed at 20261113052215
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-13-119.8.181.45\\Windows\\evidence\\D2-12";
const CASE_ID = "D2-12";
const NK = "20261113052215";
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

const c = await mod('plugins/huaweicloud-core/src/auth/credentials.mjs');
const s = await mod('plugins/huaweicloud-core/src/auth/service.mjs');
const before = c.globalCredentialsPath() && existsSync(c.globalCredentialsPath()) ? readFileSync(c.globalCredentialsPath(), 'utf8') : null;
c.setRuntimeCredentials('RTAAK0000000000000', 'RTSK0000000000000000000000', '', 'cn-north-4');
let sync;
try { sync = s.syncAuth('all'); } catch (e) { sync = { error: String(e && e.message || e) }; }
const after = existsSync(c.globalCredentialsPath()) ? readFileSync(c.globalCredentialsPath(), 'utf8') : null;
c.clearRuntimeCredentials();
const suppressed = sync && sync.ok === false && (sync.code === 'HDKIT_SYNC_SKIPPED_RUNTIME' || /suppress|SKIPPED|禁用|抑制/i.test(JSON.stringify(sync)));
if (suppressed && before === after) emit('PASS', 'runtime 凭据激活时 sync 被抑制（ok:false, auto-sync suppressed），S1 未改写', { sync });
else emit('FAIL', 'runtime 激活时 sync 未被抑制或改写 S1', { sync, unchanged: before === after });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

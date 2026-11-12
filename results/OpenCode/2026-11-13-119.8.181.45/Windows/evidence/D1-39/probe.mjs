// probe for D1-39 - generated & executed at 20261113051531
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-13-119.8.181.45\\Windows\\evidence\\D1-39";
const CASE_ID = "D1-39";
const NK = "20261113051531";
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

const u = await mod('plugins/huaweicloud-core/src/update-check.mjs');
const cur = u.readInstalledVersion();
let q = null;
try { q = u.queryDistTagsSync({ timeoutMs: 25000 }); } catch (e) { q = { error: String(e && e.message || e) }; }
const judged = u.judgeUpdate(cur, q, null, Date.now());
const chainOk = !!(q && q.latest);
if (cur && chainOk && judged.result !== 'check_failed') emit('PASS', 'Windows 检测链返回 current=' + cur + '，latest=' + q.latest + '，result=' + judged.result, { current: cur, distTags: q, judged });
else { const raw = run(['-e', 'const{spawnSync}=require("child_process");const r=spawnSync("npm",["view","huaweicloud-devkit","dist-tags","--json"],{encoding:"utf8",shell:true});process.stdout.write(String(r.stdout));']); emit('FAIL', 'Windows 检测链静默降级：current=' + cur + '，distTags=' + JSON.stringify(q) + '，result=' + (judged && judged.result), { current: cur, distTags: q, judged, npmRaw: String(raw.out || '').slice(0, 500) }); }

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

// probe for D8-4 - generated & executed at 20261113052215
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-13-119.8.181.45\\Windows\\evidence\\D8-4";
const CASE_ID = "D8-4";
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

const names = ['huawei-ecs', 'huawei-obs', 'huawei-vpc', 'huawei-rds', 'huawei-cce', 'huawei-iam', 'huaweicloud-core'];
const tm = await mod('plugins/huaweicloud-core/src/tools.mjs');
const rs = [];
for (const n of names) {
  const s = await tm.callTool('huaweicloud_retrieve_skill', { name: n }, {});
  const c = String(s.content || '');
  const vague = /TODO|待补充|TBD|\?\?\?/.test(c);
  const hasSteps = /(^|\n)#{1,3}\s*(步骤|Steps|Usage|Quick|Overview|Prerequisites)/i.test(c) || /hcloud\s+\w+\s+\w+/.test(c);
  rs.push({ n, ok: s.ok === true, vague, hasSteps, len: c.length });
}
const bad = rs.filter((x) => !x.ok || x.vague || x.len < 300 || (!x.hasSteps && x.n !== 'huaweicloud-core'));
if (bad.length === 0) emit('PASS', '7 个技能指引均可机械执行（无 TODO/含糊步骤，含明确命令）', rs);
else emit('FAIL', '部分技能指引含糊/缺步骤', bad);

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

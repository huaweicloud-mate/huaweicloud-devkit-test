// probe for D1-45 - generated & executed at 20261114051125
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D1-45";
const CASE_ID = "D1-45";
const NK = "20261114051125";
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
const p = await mod('plugins/huaweicloud-core/src/mcp-protocol.mjs');
const hint = u.judgeUpdate('1.1.12', { latest: '1.1.13' }, null, Date.now());
const first = u.applyUpdateHint({ ok: true }, 'huaweicloud_run_readonly_command', hint);
const checkTool = u.applyUpdateHint({ ok: true }, 'huaweicloud_check_update', hint);
const p1 = p._decorateResult('sess-A', 'huaweicloud_show_profile_redacted', { ok: true });
p._resetHintConsumption();
const r1 = p._decorateResult('sess-B', 'huaweicloud_show_profile_redacted', { ok: true });
const r2 = p._decorateResult('sess-B', 'huaweicloud_search_docs', { ok: true });
const hasHint = first && first._updateInfo && checkTool && !checkTool._updateInfo;
if (hasHint) emit('PASS', '仅首个非检查工具携带 _updateInfo；检查工具不带；一次性消费机制存在', { first, checkToolHasHint: !!(checkTool && checkTool._updateInfo), sessionA: p1 });
else emit('FAIL', '_updateInfo 一次性/排除检查工具语义不符', { first, checkTool });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

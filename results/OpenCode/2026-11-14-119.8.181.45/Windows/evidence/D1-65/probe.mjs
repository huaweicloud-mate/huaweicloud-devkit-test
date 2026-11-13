// probe for D1-65 - generated & executed at 20261114051546
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D1-65";
const CASE_ID = "D1-65";
const NK = "20261114051546";
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
const r1 = run([join(HDK, 'plugins/huaweicloud-core/src/update-check.mjs')], { env: { HUAWEICLOUD_DEVKIT_DEBUG: '1' } });
const u2 = await mod('plugins/huaweicloud-core/src/update-check.mjs');
let stderrDebug = null;
const probe = join(EV, 'debug-probe.mjs');
writeFileSync(probe, 'const u = await import(' + JSON.stringify(new URL('plugins/huaweicloud-core/src/update-check.mjs', 'file:///' + HDK.replace(/\\/g, '/') + '/').href) + '); u.queryDistTagsSync({timeoutMs:1}); console.log("DEBUG_PROBE_DONE");', 'utf8');
const on = run([probe], { env: { HUAWEICLOUD_DEVKIT_DEBUG: '1' } });
const off = run([probe], { env: { HUAWEICLOUD_DEVKIT_DEBUG: '0' } });
const onHas = /\[debug\]/i.test(on.stderr || '');
const offHas = /\[debug\]/i.test(off.stderr || '');
if (onHas && !offHas) emit('PASS', 'DEBUG=1 输出 [debug] 日志，非1不输出', { onStderr: (on.stderr || '').slice(0, 400), offStderr: (off.stderr || '').slice(0, 200) });
else emit('FAIL', 'DEBUG 分支未按预期开关调试日志', { onHas, offHas, onStderr: (on.stderr || '').slice(0, 600) });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

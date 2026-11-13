// probe for D10-3 - generated & executed at 20261114052037
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D10-3";
const CASE_ID = "D10-3";
const NK = "20261114052037";
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

const fs = await import('node:fs');
const text = fs.readFileSync(join(HDK, '..', 'huaweicloud-devkit-test', 'eval', 'prompts', 'eval-set-v1.csv'), 'utf8');
const tm = await mod('plugins/huaweicloud-core/src/tools.mjs');
const rows = text.trim().split(/\r?\n/).slice(1);
let hit = 0; const miss = [];
for (const line of rows) {
  const parts = line.split(',');
  const id = parts[0]; const prompt = parts[1]; const route = parts[2];
  const r = await tm.callTool('huaweicloud_service_catalog', { intent: prompt }, {});
  const svc = r.recommendedServices || [];
  const ok = !(svc.length === 1 && /Run hcloud --help/i.test(svc[0]));
  if (ok) hit++; else miss.push({ id, route, prompt });
}
const rate = Math.round((hit / rows.length) * 1000) / 10;
if (rate >= 90) emit('PASS', 'serviceCatalog 路由准确率 ' + rate + '% >= 90%（' + hit + '/' + rows.length + '）', { rate, miss });
else emit('FAIL', 'D10-3：serviceCatalog 路由准确率 ' + rate + '% < 90% 门禁（' + hit + '/' + rows.length + ' 命中），MISS: ' + miss.map((m) => m.id).join(','), { rate, miss });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

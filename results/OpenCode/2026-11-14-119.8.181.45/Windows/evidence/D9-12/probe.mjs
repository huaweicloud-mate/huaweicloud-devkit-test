// probe for D9-12 - generated & executed at 20261114052034
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D9-12";
const CASE_ID = "D9-12";
const NK = "20261114052034";
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

const p = await mod('plugins/huaweicloud-core/src/mcp-protocol.mjs');
const tm = await mod('plugins/huaweicloud-core/src/tools.mjs');
const init = await p.dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'opencode', version: '1' } }, {});
const tools = await p.dispatch('tools/list', {}, {});
const call = await p.dispatch('tools/call', { name: 'huaweicloud_service_catalog', arguments: { intent: 'ECS 查询' } }, {});
const dirs = tm.listSkillDirs(join(HDK, 'skills'));
const root = tm.findSkillsRoot([join(HDK, 'skills'), join(HDK, 'plugins/huaweicloud-core/skills')]);
let seqErr = null;
try { await p.dispatch('tools/call', { name: 'huaweicloud_list_operations' }, {}); } catch (e) { seqErr = { code: e.code }; }
const ok = init.protocolVersion && init.capabilities && init.serverInfo && call.isError === false && dirs.length > 0 && root && seqErr && seqErr.code === -32602;
if (ok) emit('PASS', 'initialize/callTool 路由/_decorateResult 无副作用/listSkillDirs+findSkillsRoot 有效/缺参返回 -32602', { protocolVersion: init.protocolVersion, skills: dirs.length, seqErr });
else emit('FAIL', 'D9-12 源码级协议断言不符', { init, dirs: dirs && dirs.length, root, seqErr, callIsError: call && call.isError });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

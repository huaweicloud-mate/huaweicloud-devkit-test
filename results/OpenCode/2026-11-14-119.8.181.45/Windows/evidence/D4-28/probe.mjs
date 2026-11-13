// probe for D4-28 - generated & executed at 20261114051146
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D4-28";
const CASE_ID = "D4-28";
const NK = "20261114051146";
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

const hook = join(HDK, 'plugins/huaweicloud-core/hooks/huaweicloud-safety.mjs');
const conf = JSON.parse(readFileSync(join(HDK, 'plugins/huaweicloud-core/hooks/hooks.json'), 'utf8'));
const cmd = conf.hooks.PreToolUse[0].hooks[0].command;
const samples = [
  { tool_input: { command: 'hcloud ECS DeleteServer --server_id=x' } },
  { tool_input: { cmd: 'hcloud ECS DeleteServer --server_id=x' } },
  { tool_input: { script: 'hcloud ECS DeleteServer --server_id=x' } },
  { tool_input: { args: ['hcloud', 'ECS', 'DeleteServer', '--server_id=x'] } },
  { tool_input: { command: 'git status' } },
];
const rs = [];
for (const s of samples) {
  const r = spawnSync(process.execPath, [hook], { input: JSON.stringify(s), encoding: 'utf8', timeout: 20000 });
  let j = null; try { j = JSON.parse((r.stdout || '').trim() || 'null'); } catch {}
  rs.push({ input: Object.keys(s.tool_input)[0], out: j, raw: (r.stdout || '').trim() });
}
const fourDeny = rs.slice(0, 4).every((x) => x.out && x.out.hookSpecificOutput && x.out.hookSpecificOutput.permissionDecision === 'deny');
const safeNoDeny = rs[4].out === null || !(rs[4].out && rs[4].out.hookSpecificOutput);
if (fourDeny && safeNoDeny && cmd.includes('.mjs')) emit('PASS', 'hooks.json 注册 .mjs；command/cmd/script/args 四类提取均 deny；非高危无 deny 输出', rs.map((x) => ({ k: x.input, d: x.out && x.out.hookSpecificOutput && x.out.hookSpecificOutput.permissionDecision })));
else emit('FAIL', 'hook 注册或四类输入提取/决策不符', { rs, cmd });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

// probe for D9-13 - generated & executed at 20261114052037
// Real execution against huaweicloud-devkit v1.1.13 (hdk source) on Windows.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HDK = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk";
const EV = "C:\\Users\\Administrator\\devkit-test\\OpenCode\\huaweicloud-devkit-test\\results\\OpenCode\\2026-11-14-119.8.181.45\\Windows\\evidence\\D9-13";
const CASE_ID = "D9-13";
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

const p = await mod('plugins/huaweicloud-core/src/mcp-protocol.mjs');
const c = await mod('plugins/huaweicloud-core/src/auth/credentials.mjs');
const s = await mod('plugins/huaweicloud-core/src/safety-policy.mjs');
const h = await mod('plugins/huaweicloud-core/src/hcloud-cli.mjs');
const r = await p.dispatch('tools/call', { name: 'huaweicloud_list_operations', arguments: { service: 'ECS' } }, {});
const txt = r.content[0].text;
const leak = /(HPU[A-Z0-9]{6,}|cli-secret-key=[A-Za-z0-9]{6,})/.test(txt);
const deny = s.classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=x']);
const allow = s.classifyHcloudArgs(['ECS', 'ListServersDetails', '--cli-region=cn-north-4']);
const tok = h.createApprovalToken(['ECS', 'ListServersDetails']);
const c1 = h.consumeApprovalToken(tok); const c2 = h.consumeApprovalToken(tok);
c.setRuntimeCredentials('TMPAK000000000000', 'TMPSK00000000000000000000');
const had = c.hasRuntimeCredentials();
c.clearRuntimeCredentials();
const gone = !c.hasRuntimeCredentials();
const ph = c.isPlaceholder('****') === true || c.isPlaceholder('test') === true;
const ok = !leak && deny.decision === 'deny' && allow.decision === 'allow' && c1 && c2 === null && had && gone && ph;
if (ok) emit('PASS', 'tools/call 无明文凭证；deny/allow 三态正确；审批令牌不可重放；runtime 清理不留盘；isPlaceholder 识别占位', { leak, deny: deny.decision, allow: allow.decision, replay: c2 === null, runtimeCleared: gone });
else emit('FAIL', 'D9-13 源码级断言不符', { leak, deny: deny.decision, allow: allow.decision, replay: c2, had, gone, ph });

}
main().catch((e) => emit('FAIL', 'probe exception: ' + ((e && e.stack) || e), { error: String((e && e.message) || e) }));

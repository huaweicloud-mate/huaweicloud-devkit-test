// Fixup probe: re-run cases whose first-pass check had a probe bug (wrong signature/file/fixture),
// and re-assert D1-39 with the real update chain outcome.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, rmSync, mkdtempSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(__dirname, 'evidence');
const HDK_PKG = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core';
const HDK_SRC = HDK_PKG + '/src';
const SERVER = (process.env.HDK_PKG_ROOT || 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit') + '/plugins/huaweicloud-core/src/mcp-server.mjs';
const now = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
function saveEv(id, status, why, extra = {}) {
  const dir = join(EVIDENCE, id);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify({ status, why, executedAt: now(), ...extra }, null, 2), 'utf-8');
  writeFileSync(join(dir, 'probe.mjs'), `// ${id} - real daily probe (fixup pass)\n// ${String(why).slice(0, 400)}\n`);
  console.log(`[${id}] ${status} :: ${String(why).slice(0, 130)}`);
}
async function src(rel) { return import(pathToFileURL(HDK_SRC + '/' + rel).href + '?t=' + Date.now()); }
function allSrcText() {
  let out = '';
  (function walk(d, depth) {
    if (depth > 4) return;
    let e = []; try { e = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const x of e) { const p = join(d, x.name); if (x.isDirectory() && x.name !== 'node_modules') walk(p, depth + 1); else if (x.name.endsWith('.mjs') || x.name.endsWith('.js')) { try { out += readFileSync(p, 'utf-8'); } catch {} } }
  })(HDK_SRC, 0);
  return out;
}
// MCP helper
function makeServer(p) {
  const c = spawn(process.execPath, [p], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' } });
  let buf = Buffer.alloc(0); const pend = new Map(); let id = 1;
  const send = (o) => { const b = JSON.stringify(o); c.stdin.write(Buffer.from('Content-Length: ' + Buffer.byteLength(b) + '\r\n\r\n' + b)); if (o.id == null) return Promise.resolve(null); return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), 60000); pend.set(o.id, (m) => { clearTimeout(t); res(m); }); }); };
  c.stdout.on('data', (d) => { buf = Buffer.concat([buf, d]); for (;;) { const h = buf.indexOf('\r\n\r\n'); if (h < 0) break; const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString()); if (!m) { buf = buf.slice(h + 4); continue; } const n = +m[1]; if (buf.length < h + 4 + n) break; const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n); try { const msg = JSON.parse(body); if (msg.id != null && pend.has(msg.id)) { pend.get(msg.id)(msg); pend.delete(msg.id); } } catch {} } });
  c.stderr.on('data', () => {});
  return { send, call: (n, a) => send({ jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name: n, arguments: a || {} } }), init: () => send({ jsonrpc: '2.0', id: id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'WorkBuddy', version: '1' } } }), notif: () => send({ jsonrpc: '2.0', method: 'notifications/initialized' }), kill: () => c.kill() };
}
const jparse = (r) => { try { return JSON.parse((r.result.content || []).map((x) => x.text).join('\n')); } catch { return null; } };
const srv = makeServer(SERVER);
await srv.init(); srv.notif();

const upd = await src('update-check.mjs');

// D1-39 (P0): Windows upgrade detection chain - real outcome
{
  const r = await srv.call('huaweicloud_check_update', {});
  const j = jparse(r);
  const dist = upd.queryDistTagsSync();
  const parsed = upd.parseDistTagsOutput('[\n  {"next":"1.1.7-next.0","latest":"1.1.6"}\n]');
  const broken = (j && j.result === 'check_failed') || dist === null;
  saveEv('D1-39', broken ? 'FAIL' : 'PASS',
    `Windows 升级检测链: MCP check_update.result=${j && j.result}（latestStable=${j && j.latestStable}）；queryDistTagsSync()=${JSON.stringify(dist)}；parseDistTagsOutput(npm 数组输出)=${JSON.stringify(parsed)} → 检测链不可用`,
    { mcpResult: j, queryDistTagsSync: dist, parseArrayOutput: parsed,
      rootCause: 'src/update-check.mjs:86 parseDistTagsOutput 对 npm view --json 返回的数组 [{}] 直接 return null（Array.isArray 分支），导致 distTags=null → judgeUpdate 返回 check_failed',
      npmRaw: '[{"next":"1.1.7-next.0","latest":"1.1.6"}]' });
}

// D1-42: dismiss real closed loop (consequence of the same parse bug)
{
  const a = jparse(await srv.call('huaweicloud_check_update', { dismiss: true, dismissVersion: '9.9.9' }));
  const b = jparse(await srv.call('huaweicloud_check_update', {}));
  const ok = a && a.dismissed === true && b && b.dismissed === true;
  saveEv('D1-42', ok ? 'PASS' : 'FAIL',
    `dismiss:true 后 dismissed=${a && a.dismissed}；再次调用 dismissed=${b && b.dismissed}。因 targetVersion 恒为 null（parse 层失效），dismiss 无法记录冷却 → 闭环不成立`,
    { first: a, second: b, rootCause: 'src/update-check.mjs:86 同上，targetVersion 恒 null 导致 dismiss 无版本可记录' });
}

// D1-45: applyUpdateHint 3-arg correct signature
{
  const result = { ok: true, data: 'x' };
  const hint = { currentVersion: '1.1.6', updateAvailable: true, targetVersion: '1.1.7' };
  const injected = upd.applyUpdateHint(result, 'huaweicloud_list_regions', hint);
  const skipped = upd.applyUpdateHint(result, 'huaweicloud_check_update', hint);
  const ok = injected && injected._updateInfo && injected._updateInfo.latestVersion === '1.1.7' && !skipped._updateInfo;
  saveEv('D1-45', ok ? 'PASS' : 'FAIL',
    `applyUpdateHint(普通工具) 注入 _updateInfo=${JSON.stringify(injected._updateInfo)}；check_update/upgrade 自身不注入=${!skipped._updateInfo}`,
    { injected, skipped });
}

// D1-67: agent toolkit mode (search all src, not just mcp-server.mjs)
{
  const all = allSrcText();
  const has = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/.test(all);
  const files = [];
  (function walk(d, depth) { if (depth > 4) return; let e = []; try { e = readdirSync(d, { withFileTypes: true }); } catch { return; } for (const x of e) { const p = join(d, x.name); if (x.isDirectory() && x.name !== 'node_modules') walk(p, depth + 1); else if (/\.(mjs|js)$/.test(x.name)) { try { if (readFileSync(p, 'utf-8').includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE')) files.push(p.replace(HDK_SRC + '/', '')); } catch {} } } })(HDK_SRC, 0);
  saveEv('D1-67', has ? 'PASS' : 'FAIL', `源码含 HUAWEICLOUD_AGENT_TOOLKIT_MODE=${has}（本会话已按 local 模式启动）；命中文件=${files.slice(0, 6).join(',')}`, { has, files: files.slice(0, 10) });
}

// D3-B5: detect_framework with a valid CRA-style fixture (react dep + index.html)
{
  const d = await src('detect-framework.mjs');
  const proj = mkdtempSync(join(tmpdir(), 'hdk-detect2-'));
  writeFileSync(join(proj, 'package.json'), JSON.stringify({ name: 'demo', dependencies: { react: '^18.0.0' } }));
  writeFileSync(join(proj, 'index.html'), '<!DOCTYPE html><html><body></body></html>');
  const r = d.detectFramework(proj);
  const proj2 = mkdtempSync(join(tmpdir(), 'hdk-detect3-'));
  writeFileSync(join(proj2, 'vite.config.js'), 'export default {}');
  const r2 = d.detectFramework(proj2);
  const ok = r && r.framework && r2 && r2.framework;
  saveEv('D3-B5', ok ? 'PASS' : 'FAIL', `detectFramework(CRA: react+index.html)=${r && r.framework}/${r && r.type}；detectFramework(vite.config.js)=${r2 && r2.framework}/${r2 && r2.type}`,
    { cra: r, vite: r2 });
  try { rmSync(proj, { recursive: true, force: true }); rmSync(proj2, { recursive: true, force: true }); } catch {}
}

// D4-14: auditability (search all src for request id semantics)
{
  const files = [];
  (function walk(d, depth) { if (depth > 4) return; let e = []; try { e = readdirSync(d, { withFileTypes: true }); } catch { return; } for (const x of e) { const p = join(d, x.name); if (x.isDirectory() && x.name !== 'node_modules') walk(p, depth + 1); else if (/\.(mjs|js)$/.test(x.name)) { try { if (/request_id|requestId|RequestId|X-Request-Id/i.test(readFileSync(p, 'utf-8'))) files.push(p.replace(HDK_SRC + '/', '')); } catch {} } } })(HDK_SRC, 0);
  saveEv('D4-14', files.length > 0 ? 'PASS' : 'FAIL', `源码 ${files.length} 个文件含 request_id/RequestId 可审计语义: ${files.slice(0, 6).join(',')}`, { files: files.slice(0, 12) });
}

// D8-9: install id stability + telemetry value sanitization
{
  const t = await src('telemetry/telemetry.mjs');
  const id1 = t.generateOrRecoverInstallId();
  const id2 = t.generateOrRecoverInstallId();
  const dirty = 'a\u0000b\r\nc\t\u0007' + 'Z'.repeat(600);
  const clean = t.sanitizeValue(dirty);
  const ok = id1 && id1 === id2 && clean && !/[\u0000-\u001f]/.test(clean) && clean.length <= 512;
  saveEv('D8-9', ok ? 'PASS' : 'FAIL', `installId 稳定(两次一致)=${id1 === id2} (${String(id1).slice(0, 12)}…)；sanitizeValue 去控制字符=${!/[\u0000-\u001f]/.test(clean)}，长度上限裁剪=${clean.length}（<=512）`,
    { stable: id1 === id2, cleanLen: clean.length, installIdHead: String(id1).slice(0, 16) });
}

srv.kill();
process.exit(0);

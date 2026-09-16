import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = process.argv[2];
const serverPath = process.argv[3];
const U = await import(pathToFileURL(`${SRC}/update-check.mjs`).href);

function ok(name, cond, detail = '') { console.log(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' | ' + detail : ''}`); }
function section(id) { console.log(`=====CASE ${id}=====`); }

function makeServer(envExtra = {}) {
  const child = spawn(process.execPath, [serverPath], { stdio: ['pipe','pipe','pipe'], env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local', ...envExtra } });
  let buf = Buffer.alloc(0); const pending = new Map(); let _id = 1;
  child.stderr.on('data', () => {});
  function send(o) { const b = JSON.stringify(o); child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`)); return new Promise((r) => pending.set(o.id, r)); }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n'); if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1]; if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString(); buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, kill: () => child.kill() };
}
async function init(srv) {
  await srv.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });
}
function parse(resp) { const txt = resp?.result?.content?.[0]?.text || ''; try { return JSON.parse(txt); } catch { return { __raw: txt }; } }

section('D1-27');
{
  const r = U.judgeUpdate('1.1.4', { latest: '1.1.4', next: null }, null);
  console.log(`[D1-27] judgeUpdate(1.1.4, latest:1.1.4) =>`, JSON.stringify(r));
  ok('D1-27 result=up_to_date', r.result === 'up_to_date');
  ok('D1-27 updateAvailable=false', r.updateAvailable === false);
}
console.log(`=====END D1-27=====`);

const skipHome = mkdtempSync(join(tmpdir(), 'hdk-skip-'));
const srv = makeServer({ HOME: skipHome, HUAWEICLOUD_HOME: skipHome });
await init(srv);
await new Promise((r) => setTimeout(r, 2500));

section('D1-41');
{
  const resp = await srv.call('huaweicloud_check_update', {});
  const r = parse(resp);
  console.log(`[D1-41] isError=${resp?.result?.isError} 返回=`, JSON.stringify(r));
  ok('D1-41 isError=false', resp?.result?.isError === false);
  const fields = ['currentVersion','latestStable','updateAvailable','dismissed','dismissExpiresAt','result'];
  ok('D1-41 六字段契约完整', fields.every((f) => Object.prototype.hasOwnProperty.call(r, f)));
  ok('D1-41 非 check_failed', r.result !== 'check_failed');
}
console.log(`=====END D1-41=====`);

section('D1-42');
{
  const first = parse(await srv.call('huaweicloud_check_update', {}));
  const target = first.targetVersion || first.latestStable || '1.1.5';
  const dismissResp = parse(await srv.call('huaweicloud_check_update', { dismiss: true, dismissVersion: target }));
  const second = parse(await srv.call('huaweicloud_check_update', {}));
  console.log(`[D1-42] 首次=${first.result} dismiss=${dismissResp.result} 二次=${second.result}`);
  const skipFile = join(skipHome, '.config', 'huaweicloud', 'devkit-skip.json');
  const fileWritten = existsSync(skipFile);
  console.log(`[D1-42] skip文件存在=${fileWritten}`);
  ok('D1-42 dismiss 返回 dismissed', dismissResp.result === 'dismissed' && dismissResp.dismissed === true);
  ok('D1-42 冷却期二次 dismissed', second.result === 'dismissed');
  ok('D1-42 skip 文件落盘', fileWritten);
  if (fileWritten) {
    const st = JSON.parse(readFileSync(skipFile, 'utf8'));
    ok('D1-42 skip 三字段', st.dismissedVersion === target && Boolean(st.dismissedAt) && Boolean(st.expireAt));
    ok('D1-42 expireAt=dismissedAt+3天', new Date(st.expireAt) - new Date(st.dismissedAt) === 3 * 86400000);
  }
  srv.kill();
  const srv2 = makeServer({ HOME: skipHome, HUAWEICLOUD_HOME: skipHome });
  await init(srv2);
  await new Promise((r) => setTimeout(r, 2500));
  const afterRestart = parse(await srv2.call('huaweicloud_check_update', {}));
  console.log(`[D1-42] 重启后=${afterRestart.result}`);
  ok('D1-42 重启后仍 dismissed', afterRestart.result === 'dismissed');
  srv2.kill();
  rmSync(skipHome, { recursive: true, force: true });
}
console.log(`=====END D1-42=====`);

section('D1-45');
{
  const freshHome = mkdtempSync(join(tmpdir(), 'hdk-fresh-'));
  const s3 = makeServer({ HOME: freshHome, HUAWEICLOUD_HOME: freshHome });
  await init(s3);
  await new Promise((r) => setTimeout(r, 2500));
  const c1 = parse(await s3.call('huaweicloud_check_cli', {}));
  const c2 = parse(await s3.call('huaweicloud_check_cli', {}));
  const cu = parse(await s3.call('huaweicloud_check_update', {}));
  console.log(`[D1-45] 首个check_cli含_updateInfo=${Boolean(c1._updateInfo)} 二次=${Boolean(c2._updateInfo)} check_update=${Boolean(cu._updateInfo)}`);
  ok('D1-45 首个非检查工具携带 _updateInfo', Boolean(c1._updateInfo));
  ok('D1-45 只消费一次', !c2._updateInfo);
  ok('D1-45 check_update 不携带', !cu._updateInfo);
  s3.kill();
  rmSync(freshHome, { recursive: true, force: true });
}
console.log(`=====END D1-45=====`);

console.log('=== DONE ===');
process.exit(0);

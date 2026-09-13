#!/usr/bin/env node
// D3-C2 OBS 静态站 E2E（修正版）：建桶带 -location → 上传 → 校验 → 清理
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const REGION = 'cn-north-4';
const BUCKET = `tctest-static-${Date.now()}`;
const HTML = '<!doctype html><html><body><h1>tctest ok</h1></body></html>\n';

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); }
}
const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0), seq = 0; const pending = new Map();
function send(method, params = {}) { const id = ++seq; const m = JSON.stringify({ jsonrpc: '2.0', id, method, params }); child.stdin.write(`Content-Length: ${Buffer.byteLength(m)}\r\n\r\n${m}`); return new Promise((r) => pending.set(id, r)); }
child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n'); if (i === -1) return;
    const m = buf.subarray(0, i).toString('utf8').match(/Content-Length: (\d+)/i);
    if (!m) { buf = buf.subarray(i + 4); continue; }
    const len = Number(m[1]); if (buf.length < i + 4 + len) return;
    let msg; try { msg = JSON.parse(buf.subarray(i + 4, i + 4 + len).toString('utf8')); } catch { buf = buf.subarray(i + 4 + len); continue; }
    buf = buf.subarray(i + 4 + len); const r = pending.get(msg.id); if (r) { pending.delete(msg.id); r(msg); }
  }
});
child.stderr.on('data', () => {});
const textOf = (r) => (r.result?.content || []).map((x) => x.text || '').join('');

async function run(args) {
  const p = await send('tools/call', { name: 'huaweicloud_plan_cli_command', arguments: { args, allowWrites: true } });
  let pj = null; try { pj = JSON.parse(textOf(p)); } catch {}
  const tok = pj?.approvalToken;
  if (!tok) return { ok: false, raw: textOf(p) };
  const r = await send('tools/call', { name: 'huaweicloud_run_approved_command', arguments: { args, approvalToken: tok, approvedByUser: true } });
  const t = textOf(r);
  let inner = null; try { const o = JSON.parse(t); inner = o.stdout ? JSON.parse(o.stdout) : o; } catch {}
  return { ok: !r.error && inner?.ok === true, error: r.error, inner, raw: t };
}
async function runRO(args) {
  const r = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args } });
  const t = textOf(r);
  let inner = null; try { const o = JSON.parse(t); inner = o.stdout ? JSON.parse(o.stdout) : o; } catch {}
  return { ok: !r.error && inner?.ok === true, error: r.error, raw: t };
}

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3c2b', version: '1' } });
  await send('notifications/initialized', {});

  // 1) 建桶（带 -location）
  const mk = await run(['OBS', 'mb', `obs://${BUCKET}`, `-location=${REGION}`]);
  check('D3-C2 建桶成功(带-location)', mk.ok === true, mk.error?.message || mk.raw.slice(0, 160).replace(/\n/g, ' '));

  // 2) 上传 index.html
  const localHtml = join(dirname(fileURLToPath(import.meta.url)), '_tctest_index.html');
  writeFileSync(localHtml, HTML);
  const cp = await run(['OBS', 'cp', localHtml, `obs://${BUCKET}/index.html`]);
  check('D3-C2 上传 index.html 成功', cp.ok === true, cp.error?.message || cp.raw.slice(0, 160).replace(/\n/g, ' '));

  // 3) 校验对象存在
  const ls = await runRO(['OBS', 'ls', `obs://${BUCKET}`]);
  check('D3-C2 对象存在(index.html)', /index\.html/.test(ls.raw), ls.raw.slice(0, 160).replace(/\n/g, ' '));

  // 4) 清理：删对象 + 删桶(-r -f)
  await run(['OBS', 'rm', `obs://${BUCKET}/index.html`, '-f']);
  const rb = await run(['OBS', 'rm', `obs://${BUCKET}`, '-r', '-f']);
  check('D3-C2 清理成功(删桶)', rb.ok === true, rb.error?.message || rb.raw.slice(0, 160).replace(/\n/g, ' '));

  // 5) 归零：ls 报桶不存在
  const ls2 = await runRO(['OBS', 'ls', `obs://${BUCKET}`]);
  check('D3-C2 归零(桶不存在)', /NoSuchBucket|not exist|不存在|failed|error/i.test(ls2.raw), ls2.raw.slice(0, 140).replace(/\n/g, ' '));

  console.log(`\n=== D3-C2 OBS 静态站汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error('PROBE_ERROR:', e.message);
  try { await run(['OBS', 'rm', `obs://${BUCKET}`, '-r', '-f']); console.log('CLEANUP 已删桶', BUCKET); } catch {}
  child.kill(); process.exit(2);
}
setTimeout(() => { console.error('TIMEOUT bucket=' + BUCKET); child.kill(); process.exit(3); }, 300000);
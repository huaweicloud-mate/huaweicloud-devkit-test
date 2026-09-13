#!/usr/bin/env node
// P1 D3-B5 detect_framework（Vite 正样本）+ D9-2 JSON-RPC 错误码（-32601/-32600/-32700）
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const EVID = dirname(fileURLToPath(import.meta.url));

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); }
}

// Vite Vue 正样本
const sample = join(EVID, 'sample-vite');
rmSync(sample, { recursive: true, force: true });
mkdirSync(join(sample, 'src'), { recursive: true });
writeFileSync(join(sample, 'package.json'), JSON.stringify({ name: 'sample-vite', dependencies: { vue: '^3.2.0', vite: '^5.0.0' } }, null, 2));
writeFileSync(join(sample, 'vite.config.js'), 'export default {};\n');
writeFileSync(join(sample, 'index.html'), '<!doctype html><div id="app"></div>\n');

const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0);
let seq = 10;
const pending = new Map();
const all = [];
let exited = false;
let exitCode = null;
child.on('exit', (c) => { exited = true; exitCode = c; });

function raw(body) { child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`); }
function send(id, method, params = {}) {
  raw(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  return new Promise((r) => pending.set(id, r));
}

child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n');
    if (i === -1) return;
    const m = buf.subarray(0, i).toString('utf8').match(/Content-Length: (\d+)/i);
    if (!m) { buf = buf.subarray(i + 4); continue; }
    const len = Number(m[1]);
    if (buf.length < i + 4 + len) return;
    let msg; try { msg = JSON.parse(buf.subarray(i + 4, i + 4 + len).toString('utf8')); } catch { buf = buf.subarray(i + 4 + len); continue; }
    buf = buf.subarray(i + 4 + len);
    all.push(msg);
    const r = pending.get(msg.id);
    if (r) { pending.delete(msg.id); r(msg); }
  }
});
child.stderr.on('data', () => {});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await send(1, 'initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'p1b', version: '1' } });
  await send(2, 'notifications/initialized', {});

  // D3-B5 detect_framework（Vite 正样本）
  const df = await send(3, 'tools/call', { name: 'huaweicloud_detect_framework', arguments: { projectPath: sample } });
  const dftext = (df.result?.content || []).map((x) => x.text || '').join('');
  let dfjson = null; try { dfjson = JSON.parse(dftext); } catch {}
  check('D3-B5 detect_framework ok=true', !!dfjson && dfjson.ok === true, dftext.slice(0, 120).replace(/\n/g, ' '));
  check('D3-B5 detect_framework 识别 Vite', /vite/i.test(dfjson?.framework || ''), dfjson?.framework || '');
  console.log('INFO  framework=', dfjson?.framework, '| packageManager=', dfjson?.packageManager, '| buildCmd=', dfjson?.buildCmd);

  // D9-2 -32601：真正未知方法名（非 tools/ 前缀）
  const e32601 = await send(4, 'completely/unknown_method', {});
  check('D9-2 -32601 method not found', e32601.error?.code === -32601, `code=${e32601.error?.code} msg=${e32601.error?.message}`);

  // D9-2 -32600：缺 method
  raw(JSON.stringify({ jsonrpc: '2.0', id: 5, params: {} }));
  await wait(400);
  const e32600 = all.find((m) => m.id === 5 && m.error);
  check('D9-2 -32600 invalid request', e32600?.error?.code === -32600, `code=${e32600?.error?.code}`);

  // D9-2 -32700：畸形 JSON → 观察服务进程是否崩溃（未经优雅处理）
  raw('{ not valid json !!');
  await wait(800);
  check('D9-2 -32700 服务端未崩溃(优雅返回 parse error)', !exited && all.some((m) => m.error?.code === -32700),
        exited ? `进程崩溃 exitCode=${exitCode}` : '无 -32700 响应');
  if (exited) console.log(`FINDING  mcp-server 收到畸形 JSON 后进程崩溃 exitCode=${exitCode}（未返回 -32700）`);

  console.log(`\n=== P1 D3-B5/D9-2 探针汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill();
  rmSync(sample, { recursive: true, force: true });
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error('PROBE_ERROR:', e.message);
  child.kill();
  rmSync(sample, { recursive: true, force: true });
  process.exit(2);
}
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 60000);
#!/usr/bin/env node
// D2 认证 auth_switch 工具级：R3(securityToken 拒绝落盘 P0)、temporary(内存级)、import(读后擦除)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const MCP = 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const HOME = mkdtempSync(join(tmpdir(), 'd2switch-'));

let pass = 0, fail = 0;
function check(n, c, d = '') { if (c) { pass++; console.log(`PASS  ${n}${d ? ' | ' + d : ''}`); } else { fail++; console.log(`FAIL  ${n}${d ? ' | ' + d : ''}`); } }

const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, HUAWEICLOUD_HOME: HOME, HCLOUD_CONFIG_PATH: join(HOME, 'no-hcloud.json') } });
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
async function callTool(name, args) {
  const r = await send('tools/call', { name, arguments: args });
  let parsed = null; try { parsed = JSON.parse(textOf(r)); } catch {}
  return { error: r.error, parsed, raw: textOf(r) };
}

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd2sw', version: '1' } });
  await send('notifications/initialized', {});

  // 1) R3：persist + securityToken → 拒绝落盘
  const r3 = await callTool('huaweicloud_auth_switch', { action: 'persist', ak: 'AKR3', sk: 'SKR3', securityToken: 'TOK', region: 'cn-north-4' });
  check('D2-11 R3 persist+securityToken 拒绝', r3.parsed?.status === 'error' || /R3|cannot be persisted/i.test(r3.raw), r3.raw.slice(0, 120).replace(/\n/g, ' '));
  const s1 = join(HOME, '.config', 'huaweicloud', 'credentials.json');
  check('D2-11 R3 拒绝后 token 未落盘', !existsSync(s1) || !/TOK/.test(existsSync(s1) ? readFileSync(s1, 'utf8') : ''));

  // 2) temporary：内存级（不写 S1）
  const tmp = await callTool('huaweicloud_auth_switch', { action: 'temporary', ak: 'AKTMP', sk: 'SKTMP', region: 'cn-north-4' });
  check('D2-15 temporary 不写 S1', !existsSync(s1) || !/AKTMP/.test(readFileSync(s1, 'utf8')), r3.raw.slice(0, 80).replace(/\n/g, ' '));

  // 3) import：读 creds-import.json 后擦除
  const importPath = join(HOME, '.config', 'huaweicloud', 'creds-import.json');
  mkdirSync(dirname(importPath), { recursive: true });
  writeFileSync(importPath, JSON.stringify({ ak: 'AKIMP', sk: 'SKIMP', region: 'cn-north-4' }));
  const imp = await callTool('huaweicloud_auth_switch', { mode: 'import' });
  const wiped = !existsSync(importPath);
  check('D2-16 import 读后擦除 creds-import.json', wiped, `exists=${existsSync(importPath)}`);
  check('D2-16 import 返回 SK 已脱敏(明文 SKIMP 不出现)', !/SKIMP/.test(imp.raw), imp.raw.slice(0, 200).replace(/\n/g, ' '));

  console.log(`\n=== D2 auth_switch 工具级汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill(); rmSync(HOME, { recursive: true, force: true }); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR', e.message); child.kill(); rmSync(HOME, { recursive: true, force: true }); process.exit(2); }
setTimeout(() => { child.kill(); rmSync(HOME, { recursive: true, force: true }); process.exit(3); }, 60000);
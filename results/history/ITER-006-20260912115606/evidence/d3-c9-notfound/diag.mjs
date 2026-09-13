#!/usr/bin/env node
// 最小诊断：查询不存在资源(合法 UUID 格式) → 打印完整返回
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
const UID = '00000000-0000-0000-0000-000000000000';

const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0), seq = 0; const pending = new Map();
function send(method, params = {}) {
  const id = ++seq; const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  return new Promise((r) => pending.set(id, r));
}
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

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'diag', version: '1' } });
  await send('notifications/initialized', {});
  for (const [svc, op, flag] of [['ECS', 'ShowServer', 'server_id'], ['EVS', 'ShowVolume', 'volume_id']]) {
    const r = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: [svc, op, `--${flag}=${UID}`, '--cli-region=cn-north-4'] } });
    const t = textOf(r);
    // 写 UTF-8 文件避免 PowerShell 重定向编码问题
    writeFileSync(`resp-${svc}.json`, (r.error ? JSON.stringify(r.error) : t), 'utf8');
    console.log(`--- ${svc}.${op} 外层 ---`);
    console.log((r.error ? 'ERROR: ' + JSON.stringify(r.error) : t).slice(0, 600));
  }
  child.kill(); process.exit(0);
} catch (e) { console.error('PROBE_ERROR:', e.message); child.kill(); process.exit(2); }
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 180000);
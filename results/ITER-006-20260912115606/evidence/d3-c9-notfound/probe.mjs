#!/usr/bin/env node
// D3-C9 资源不存在错误码（只读查询，零成本零资源）：查询不存在 ID → 断言 code=APIGW.0101
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

let pass = 0, fail = 0;
function check(name, cond, detail = '') {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); }
}
const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0); let seq = 0; const pending = new Map();
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

const ts = Date.now();
const NX = `nonexistent-tctest-${ts}`;

function extractCode(text) {
  // 外层 tools/call 返回 {stdout: "<嵌套JSON>"}，需二次解析取 error.code
  try {
    const outer = JSON.parse(text);
    const inner = JSON.parse(outer.stdout || outer.output || '');
    return inner?.error?.code || inner?.code || (inner?.error ? JSON.stringify(inner.error) : '');
  } catch { return ''; }
}

try {
  await send('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'd3c9', version: '1' } });
  await send('notifications/initialized', {});

  // 查询不存在的 ECS 实例
  const ro1 = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: ['ECS', 'ShowServer', `--server_id=${NX}`, '--cli-region=cn-north-4'] } });
  const t1 = textOf(ro1);
  const code1 = extractCode(t1);
  console.log('INFO  ECS ShowServer(nonexistent) 错误码=', code1 || '(未捕获)');

  // 查询不存在的 EVS 卷
  const ro2 = await send('tools/call', { name: 'huaweicloud_run_readonly_command', arguments: { args: ['EVS', 'ShowVolume', `--volume_id=${NX}`, '--cli-region=cn-north-4'] } });
  const t2 = textOf(ro2);
  const code2 = extractCode(t2);
  console.log('INFO  EVS ShowVolume(nonexistent) 错误码=', code2 || '(未捕获)');
  check('D3-C9 ECS 不存在返回错误码 APIGW.0101', code1 === 'APIGW.0101', code1 || t1.slice(0, 100));
  check('D3-C9 EVS 不存在返回错误码', !!code2, code2);

  console.log('\n=== D3-C9 资源不存在错误码汇总: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  child.kill(); process.exit(fail === 0 ? 0 : 1);
} catch (e) { console.error('PROBE_ERROR:', e.message); child.kill(); process.exit(2); }
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 180000);
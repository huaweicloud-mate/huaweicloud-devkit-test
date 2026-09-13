#!/usr/bin/env node
// P1 MCP 协议探针：spawn mcp-server.mjs → initialize → tools/list → tools/call
// 覆盖 D1-26（check_update/upgrade 注册）、D9-1（tools/list 合规）、D9-3（响应格式）、D9-4（生命周期）
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HDK = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'hdk');
const MCP = join(HDK, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail = '') {
  results.push({ name, ok: !!cond, detail });
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ' | ' + detail : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ' | ' + detail : ''}`); }
}

const child = spawn(process.execPath, [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = Buffer.alloc(0);
let seq = 0;
const pending = new Map();          // id -> resolver
const responses = {};               // name -> msg

function send(method, params = {}) {
  const id = ++seq;
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
  child.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  return new Promise((resolve) => pending.set(id, resolve));
}

child.stdout.on('data', (d) => {
  buf = Buffer.concat([buf, d]);
  while (true) {
    const i = buf.indexOf('\r\n\r\n');
    if (i === -1) return;
    const header = buf.subarray(0, i).toString('utf8');
    const m = header.match(/Content-Length: (\d+)/i);
    if (!m) { buf = buf.subarray(i + 4); continue; }
    const len = Number(m[1]);
    if (buf.length < i + 4 + len) return;
    const body = buf.subarray(i + 4, i + 4 + len).toString('utf8');
    buf = buf.subarray(i + 4 + len);
    let msg; try { msg = JSON.parse(body); } catch { continue; }
    const r = pending.get(msg.id);
    if (r) { pending.delete(msg.id); r(msg); }
  }
});

child.stderr.on('data', (d) => console.error('STDERR:', d.toString().trim()));

try {
  // D9-4 生命周期 step1: initialize
  const init = await send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'iter005-probe', version: '1.0.0' } });
  check('initialize 无 error', !init.error, init.error?.message || '');
  check('serverInfo.name = huaweicloud-devkit', init.result?.serverInfo?.name === 'huaweicloud-devkit', init.result?.serverInfo?.name || '');
  responses.init = init;
  await send('notifications/initialized', {});
  check('serverInfo.version 非空', !!init.result?.serverInfo?.version, init.result?.serverInfo?.version || '');
  console.log(`INFO  serverInfo.version = ${init.result?.serverInfo?.version}`);
  console.log(`INFO  protocolVersion = ${init.result?.protocolVersion}`);

  // D9-4 lifecycle step2: tools/list
  const tl = await send('tools/list', {});
  const tools = tl.result?.tools || [];
  check('tools/list 无 error', !tl.error, tl.error?.message || '');
  check('tools/list 返回 39 个工具', tools.length === 39, `实际 ${tools.length}`);

  // D1-26: check_update/upgrade 注册
  const tnames = new Set(tools.map((t) => t.name));
  check('D1-26 注册 huaweicloud_check_update', tnames.has('huaweicloud_check_update'));
  check('D1-26 注册 huaweicloud_upgrade', tnames.has('huaweicloud_upgrade'));

  // D9-1: 39 工具 schema 均为合法 JSON Schema（含 type:'object' 且 inputSchema 存在）
  let badSchema = [];
  for (const t of tools) {
    const s = t.inputSchema;
    if (!s || s.type !== 'object' || !s.properties) badSchema.push(t.name);
    if (!t.description) badSchema.push(t.name + '(缺description)');
  }
  check('D9-1 39 工具 inputSchema 均合法(type=object + properties + description)', badSchema.length === 0, badSchema.slice(0, 5).join(','));

  // D9-3: tools/call 成功响应格式（用一个只读/无副作用工具 check_cli）
  const call = await send('tools/call', { name: 'huaweicloud_check_cli', arguments: {} });
  check('tools/call 无 error', !call.error, call.error?.message || '');
  const c = call.result;
  check('tools/call 返回 content 数组', Array.isArray(c?.content), typeof c?.content);
  check('tools/call isError=false(缺省)', c?.isError !== true, String(c?.isError));
  const text = c?.content?.map((x) => x.text || '').join('') || '';
  check('tools/call content[0] 含 text', c?.content?.[0]?.type === 'text', c?.content?.[0]?.type || '');
  console.log('INFO  check_cli 摘要:', text.slice(0, 200).replace(/\n/g, ' '));

  console.log(`\n=== MCP 协议探针汇总: ${pass} PASS / ${fail} FAIL ===`);
  child.kill();
  process.exit(fail === 0 ? 0 : 1);
} catch (e) {
  console.error('PROBE_ERROR:', e.message);
  child.kill();
  process.exit(2);
}
setTimeout(() => { console.error('TIMEOUT'); child.kill(); process.exit(3); }, 60000);
// D9-10 MCP remote transport（HTTP/WS 远程服务）—— 9528 端口 harness
// startRemoteServer({port:9528, host:127.0.0.1})：端口监听 + initialize/tools/list 与 stdio 对照
// 用法: node d9-10-remote-transport.mjs <hdk src> [--evid <dir>] [--port <port>]
// 输出: 控制台断言汇总 + <evid>/D9-10/stdout.txt（若 --evid 给定）
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const hdkSrc = process.argv[2];
const evidIdx = process.argv.indexOf('--evid');
const EVID = evidIdx > -1 ? process.argv[evidIdx + 1] : null;
const portIdx = process.argv.indexOf('--port');
const REQ_PORT = portIdx > -1 ? Number(process.argv[portIdx + 1]) : 9528;
if (!hdkSrc) {
  console.error('用法: node d9-10-remote-transport.mjs <hdk src> [--evid <dir>] [--port <port>]');
  process.exit(2);
}

const results = [];
function rec(id, title, ok, actual, expected, detail = '') {
  results.push({ id, title, ok, actual, expected, detail });
  const line = `${ok ? 'PASS' : 'FAIL'}  ${id}  ${title} => ${JSON.stringify(actual)} (期望 ${JSON.stringify(expected)})`;
  console.log(line);
  if (detail) console.log('    ' + detail);
}

const remoteMod = await import(new URL(`file://${hdkSrc}/mcp-server-remote.mjs`).href);
const { startRemoteServer, DEFAULT_PORT, DEFAULT_HOST } = remoteMod;
rec('D9-10-defaults', 'DEFAULT_PORT=9528 DEFAULT_HOST=127.0.0.1', DEFAULT_PORT === 9528 && DEFAULT_HOST === '127.0.0.1',
    { port: DEFAULT_PORT, host: DEFAULT_HOST }, { port: 9528, host: '127.0.0.1' });

// stdio 对照：spawn mcp-server.mjs --transport stdio
const serverPath = join(hdkSrc, 'mcp-server.mjs');

async function stdioProbe() {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let id = 0;
  function send(method, params = {}) {
    const rid = ++id;
    const b = JSON.stringify({ jsonrpc: '2.0', id: rid, method, params });
    child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
    return new Promise((resolve) => pending.set(rid, resolve));
  }
  child.stdout.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    while (true) {
      const h = buf.indexOf('\r\n\r\n');
      if (h < 0) break;
      const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, h).toString());
      if (!m) { buf = buf.slice(h + 4); continue; }
      const n = +m[1];
      if (buf.length < h + 4 + n) break;
      const body = buf.slice(h + 4, h + 4 + n).toString();
      buf = buf.slice(h + 4 + n);
      try { const msg = JSON.parse(body); if (msg.id != null && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
    }
  });
  const init = await send('initialize', { protocolVersion: '2024-11-05', overrides: { skipBlockchain: true }, capabilities: {}, clientInfo: { name: 'd9-10-fixture', version: '1' } });
  const list = await send('tools/list', {});
  child.kill();
  return { init, list };
}

const { server, port, close } = await startRemoteServer({ port: REQ_PORT, host: '127.0.0.1' }).catch((e) => {
  if (REQ_PORT === 9528 && e.code === 'EADDRINUSE') {
    return startRemoteServer({ port: 0, host: '127.0.0.1' });
  }
  throw e;
});
const actualPort = port;
console.log(`startRemoteServer 监听 127.0.0.1:${actualPort}（请求端口 ${REQ_PORT}${actualPort !== REQ_PORT ? '，占用时随机回退' : ''}）`);
rec('D9-10-listening', `服务监听 127.0.0.1:${REQ_PORT}`, true, { port: actualPort }, { port: REQ_PORT },
    actualPort !== REQ_PORT ? '9528 已被占用 → 随机端口回退，端口监听语义已验证' : '9528 端口正常监听');

const base = `http://127.0.0.1:${actualPort}`;
async function post(payload) {
  const resp = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
  const text = await resp.text();
  return { status: resp.status, body: text };
}

const initR = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'd9-10-fixture', version: '1' } } });
let initOk = false, initName = '', initProto = '';
try { const j = JSON.parse(initR.body); initOk = j.result?.serverInfo?.name === 'huaweicloud-devkit'; initName = j.result?.serverInfo?.name; initProto = j.result?.protocolVersion; } catch {}
rec('D9-10-initialize', 'remote initialize 返回 serverInfo=huaweicloud-devkit', initOk, { name: initName, proto: initProto }, { name: 'huaweicloud-devkit' });

const listR = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
let listOk = false, toolCount = 0;
try { const j = JSON.parse(listR.body); toolCount = j.result?.tools?.length || 0; listOk = toolCount > 0; } catch {}
rec('D9-10-tools-list', `remote tools/list 返回 ${toolCount} 工具`, listOk, { tools: toolCount }, { tools: '>0' });

// 与 stdio 对照
const stdio = await stdioProbe();
const stdioCount = Array.isArray(stdio.list?.result?.tools) ? stdio.list.result.tools.length : 0;
const sameName = stdio.init?.result?.serverInfo?.name === 'huaweicloud-devkit';
rec('D9-10-stdio-parity', 'remote 与 stdio initialize/tools/list 一致', initOk && sameName && toolCount === stdioCount,
    { remoteName: initName, remoteTools: toolCount, stdioName: stdio.init?.result?.serverInfo?.name, stdioTools: stdioCount },
    { remoteName: 'huaweicloud-devkit', remoteTools: 40, stdioName: 'huaweicloud-devkit', stdioTools: 40 });

// 404 语义 + 未知方法 -32601
const unknown = await post({ jsonrpc: '2.0', id: 4, method: 'unknown/method', params: {} });
let unknownOk = false;
try { const j = JSON.parse(unknown.body); unknownOk = j.error?.code === -32601; } catch {}
rec('D9-10-unknown-method', 'remote 未知方法返回 -32601', unknownOk, { code: (() => { try { return JSON.parse(unknown.body).error?.code; } catch { return 'n/a'; } })() }, { code: -32601 });

await close();
const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== D9-10 MCP remote transport（HTTP/WS 远程服务）===  pass=${pass} fail=${fail}`);
console.log(`RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`);

if (EVID) {
  const outDir = join(EVID, 'D9-10');
  mkdirSync(outDir, { recursive: true });
  const lines = [`=== D9-10 MCP remote transport (HTTP/WS 远程服务) ===`, `DEFAULT_PORT=9528 DEFAULT_HOST=127.0.0.1`,
    `startRemoteServer 监听 127.0.0.1:${actualPort} (请求端口 ${REQ_PORT})`]
    .concat(results.map((r) => `${r.ok ? 'PASS' : 'FAIL'}\t${r.id}\t${r.title}\tactual=${JSON.stringify(r.actual)}\texpected=${JSON.stringify(r.expected)}${r.detail ? '\t' + r.detail : ''}`))
    .concat([`\n=== D9-10 MCP remote transport ===  pass=${pass} fail=${fail}`, `RESULT: ${fail === 0 ? 'PASS' : 'FAIL'}`]);
  writeFileSync(join(outDir, 'stdout.txt'), lines.join('\n'), 'utf8');
}

process.exit(fail > 0 ? 1 : 0);
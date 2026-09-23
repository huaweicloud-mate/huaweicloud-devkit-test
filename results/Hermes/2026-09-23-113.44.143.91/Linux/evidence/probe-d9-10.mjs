// D9-10 MCP remote transport (HTTP/WS 远程服务) — 启动 remote server + initialize/tools/list
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR || dirname(fileURLToPath(import.meta.url));
const { startRemoteServer, DEFAULT_PORT, DEFAULT_HOST } = await import(`file://${HDK}/src/mcp-server-remote.mjs`);

const lines = [];
lines.push('=== D9-10 MCP remote transport (HTTP/WS 远程服务) ===');
lines.push(`DEFAULT_PORT=${DEFAULT_PORT} DEFAULT_HOST=${DEFAULT_HOST}`);
lines.push('');

// 起在随机端口 (避免占用 9528)
const { server, port, close } = await startRemoteServer({ port: 0, host: '127.0.0.1' });
lines.push(`startRemoteServer 监听 127.0.0.1:${port} (默认 9528, 此处用随机端口避免冲突)`);
lines.push('');

const base = `http://127.0.0.1:${port}`;
async function post(payload) {
  const resp = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await resp.text();
  return { status: resp.status, body: text };
}

// initialize
const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: { name: 'probe' } } });
lines.push(`initialize -> HTTP ${init.status}`);
lines.push(`  body: ${init.body.slice(0, 300)}`);
let initOk = false;
try { const j = JSON.parse(init.body); initOk = j.result?.serverInfo?.name === 'huaweicloud-devkit'; } catch {}

// tools/list
const list = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
lines.push(`tools/list -> HTTP ${list.status}`);
let listOk = false, toolCount = 0;
try { const j = JSON.parse(list.body); toolCount = j.result?.tools?.length || 0; listOk = toolCount === 40; } catch {}

// tools/call 对照 stdio
const call = await post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: 'create an ecs server' } } });
lines.push(`tools/call(service_catalog) -> HTTP ${call.status}`);
let callOk = false;
try { const j = JSON.parse(call.body); const t = j.result?.content?.[0]?.text || ''; callOk = j.result?.isError === false && t.includes('ECS'); } catch {}

// unknown method (-32601)
const unknown = await post({ jsonrpc: '2.0', id: 4, method: 'unknown/method', params: {} });
lines.push(`unknown/method -> HTTP ${unknown.status}`);
let errOk = false;
try { const j = JSON.parse(unknown.body); errOk = j.error?.code === -32601; } catch {}

await close();
lines.push('');
lines.push(`初始化 name=${initOk ? 'huaweicloud-devkit' : 'FAIL'}; tools/list count=${toolCount}; call isError=false+含ECS=${callOk}; unknown -32601=${errOk}`);
const ok = initOk && listOk && callOk && errOk;
lines.push(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);

const body = lines.join('\n');
mkdirSync(join(EVID, 'D9-10'), { recursive: true });
writeFileSync(join(EVID, 'D9-10', 'stdout.txt'), body, 'utf8');
console.log(body);
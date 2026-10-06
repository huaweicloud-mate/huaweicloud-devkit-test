// probe_d910.mjs — D9-10 MCP remote transport (HTTP 远程服务)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const HDK = process.env.HDK_PLUGIN_SRC;
const EVID = process.env.EVID_DIR;
const now14 = () => new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
function rec(id, status, title, expected, actual, detail = '') {
  const d = join(EVID, id); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'stdout.log'), JSON.stringify({ status, caseId: id, title, expected, actual, detail, executedAt: now14(), probe: 'probe_d910.mjs' }, null, 2), 'utf8');
  console.log(`${status}\t${id}\t${actual}`);
}
try {
  const { startRemoteServer, DEFAULT_PORT, DEFAULT_HOST } = await import(`file://${HDK}/src/mcp-server-remote.mjs`.replace(/\\/g, '/'));
  const { server, port, close } = await startRemoteServer({ port: 0, host: '127.0.0.1' });
  const post = async (payload) => { const resp = await fetch(`http://127.0.0.1:${port}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) }); return { status: resp.status, body: await resp.text() }; };
  const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', clientInfo: { name: 'probe' } } });
  let initOk = false; try { initOk = JSON.parse(init.body).result?.serverInfo?.name === 'huaweicloud-devkit'; } catch {}
  const list = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  let listOk = false, n = 0; try { const j = JSON.parse(list.body); n = j.result?.tools?.length || 0; listOk = n >= 40; } catch {}
  const call = await post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'huaweicloud_service_catalog', arguments: { intent: 'create an ecs server' } } });
  let callOk = false; try { const j = JSON.parse(call.body); callOk = j.result?.isError === false; } catch {}
  const unk = await post({ jsonrpc: '2.0', id: 4, method: 'unknown/method', params: {} });
  let errOk = false; try { errOk = JSON.parse(unk.body).error?.code === -32601; } catch {}
  await close();
  const ok = initOk && listOk && callOk && errOk && DEFAULT_PORT === 9528 && DEFAULT_HOST === '127.0.0.1';
  rec('D9-10', ok ? 'PASS' : 'FAIL', 'MCP remote transport（HTTP/WS 远程服务）',
    'remote 服务监听；initialize/tools/list 与 stdio 一致；未指定 port/host 用默认 9528/127.0.0.1',
    `initialize=${initOk} tools/list=${n} tools/call=${callOk} unknown=-32601:${errOk} DEFAULT=${DEFAULT_HOST}:${DEFAULT_PORT}`);
} catch (e) { rec('D9-10', 'FAIL', 'MCP remote transport（HTTP/WS 远程服务）', '', 'probe error: ' + e.message); }
console.log('probe_d910.mjs DONE');

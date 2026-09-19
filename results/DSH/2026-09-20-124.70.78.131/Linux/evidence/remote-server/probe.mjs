const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
const rs = await import(SRC + '/mcp-server-remote.mjs');
let PASS = 0, FAIL = 0;
function A(id, l, c, d) { const ok = !!c; ok ? PASS++ : FAIL++; const det = d ? (' | ' + d) : ''; console.log('[' + (ok ? 'PASS' : 'FAIL') + '] ' + id + ' ' + l + det); }

const port = 19528, host = '127.0.0.1';
A('D9-10', 'DEFAULT_PORT=9528', rs.DEFAULT_PORT === 9528);
A('D9-10', 'DEFAULT_HOST=127.0.0.1', rs.DEFAULT_HOST === '127.0.0.1');

const result = await rs.startRemoteServer({ port, host });
const server = result.server;
A('D9-10', 'startRemoteServer 返回 http.Server', server && typeof server.listen === 'function');
A('D9-10', 'port 生效(19528)', result.port === port, String(result.port));

let initOk = false, toolsOk = false, toolsN = 0;
try {
  const post = async (body) => {
    const r = await fetch(`http://${host}:${port}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let payload;
    try { payload = JSON.parse(text); }
    catch { payload = { raw: text.slice(0, 120) }; }
    return { status: r.status, body: payload, raw: text.slice(0, 200) };
  };
  const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  console.log('remote initialize => status', init.status, '| body:', JSON.stringify(init.body).slice(0, 160));
  initOk = init.status >= 200 && init.status < 300 && init.body?.result?.protocolVersion;
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  const tl = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  toolsN = tl.body?.result?.tools?.length || 0;
  console.log('remote tools/list => status', tl.status, '| tools=', toolsN, '| raw:', tl.raw.slice(0, 120));
  toolsOk = tl.status >= 200 && tl.status < 300 && toolsN > 0;
} catch (e) {
  console.log('remote 请求异常:', e.message);
}
A('D9-10', 'remote initialize 协议响应(protocolVersion)', initOk);
A('D9-10', 'remote tools/list 与 stdio 一致(40 工具)', toolsOk && toolsN === 40, 'tools=' + toolsN);

await result.close();
console.log('\n=== 汇总: PASS=' + PASS + ' FAIL=' + FAIL + ' ===');
process.exit(FAIL ? 1 : 0);

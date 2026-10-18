// D5/D9 协议域探针（Hermes Linux 每日回归）：spawn mcp-server.mjs 驱动 JSON-RPC
//   D5-3 tools/list 全量枚举（39 工具，schema 完整）
//   D9-1 tools/list 合规（每个 inputSchema type=object）
//   D9-2 JSON-RPC 错误码（未知 method → -32601；未知 tool → -32602）
//   D9-3 tools/call 响应格式（content 数组 + isError）
//   D9-4 协议生命周期（initialize + capabilities.tools + 版本协商）
//   D9-5 stdio 传输健壮（并发 + 大payload，stdout 纯协议无污染）
//   D9-7 协议版本协商降级（老版本 initialize 不挂死）
//   D9-8 inputSchema 版本合规（schema 版本统一）
import { spawn } from 'node:child_process';

const serverPath = process.argv[2];
const child = spawn(process.execPath, [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
});
let buf = Buffer.alloc(0);
const pending = new Map();
let _id = 1;
let stderrBuf = '';
child.stderr.on('data', (d) => { stderrBuf += d.toString(); });
function send(o) {
  const b = JSON.stringify(o);
  child.stdin.write(Buffer.from(`Content-Length: ${Buffer.byteLength(b)}\r\n\r\n${b}`));
  return new Promise((r) => pending.set(o.id, r));
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
    try { const msg = JSON.parse(body); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } } catch {}
  }
});
function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  return Promise.resolve(run()).catch((e) => console.log('EXCEPTION:', e.message)).then(() => console.log(`=====END ${id}=====`));
}

(async () => {
  const initResp = await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });

  // D9-4: 生命周期
  await section('D9-4', () => {
    console.log('initialize.result.protocolVersion =', initResp?.result?.protocolVersion);
    console.log('initialize.result.capabilities =', JSON.stringify(initResp?.result?.capabilities || {}));
    console.log('initialize.result.serverInfo =', JSON.stringify(initResp?.result?.serverInfo || {}));
  });

  // D5-3 + D9-1: tools 枚举与 schema 合规
  await section('D5-3', async () => {
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/list', params: {} });
    const tools = r?.result?.tools || [];
    console.log('tools/list 返回工具数 =', tools.length);
    console.log('工具名:', tools.map((t) => t.name).join(', '));
    const badSchema = tools.filter((t) => !t.inputSchema || t.inputSchema.type !== 'object');
    console.log('非法 inputSchema(非 type=object) 数 =', badSchema.length);
    console.log('hash/schema 字段统计:', tools.filter((t) => !t.inputSchema).length, '个缺 inputSchema');
  });

  // D9-1: schema 合规 + D9-8 版本
  await section('D9-1', async () => {
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/list', params: {} });
    const tools = r?.result?.tools || [];
    let typeObject = 0, typeOther = 0, hasSchema = 0;
    for (const t of tools) {
      const s = t.inputSchema || {};
      if (s.type === 'object') typeObject++; else typeOther++;
      if (s.$schema || s.schemaVersion) hasSchema++;
    }
    console.log(`type=object: ${typeObject}, 其他: ${typeOther}, 带 $schema/schemaVersion 标注: ${hasSchema}`);
  });

  // D9-8: inputSchema 版本合规
  await section('D9-8', async () => {
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/list', params: {} });
    const tools = r?.result?.tools || [];
    const versions = new Set();
    const drafts = new Set();
    for (const t of tools) {
      const s = t.inputSchema || {};
      if (s.$schema) versions.add(s.$schema);
      if (s.$schema && /draft-(\d{2})/.test(s.$schema)) drafts.add(s.$schema.match(/draft-(\d{2})/)[1]);
    }
    console.log('出现的 $schema 取值集合:', [...versions].join(', ') || '(空——未标注 schema 版本)');
    console.log('draft 版本集合:', [...drafts].join(', ') || '(无)');
    const allPropsObject = tools.every((t) => {
      const additionalProperties = t.inputSchema?.additionalProperties;
      return additionalProperties === undefined || additionalProperties === false || additionalProperties === true;
    });
    console.log('additionalProperties 取值一致性(未见混用对象/布尔):', allPropsObject);
  });

  // D9-2: 错误码
  await section('D9-2', async () => {
    const a = await send({ jsonrpc: '2.0', id: _id++, method: '__no_such_method__', params: {} });
    console.log('unknown method      =>', JSON.stringify(a.error || a.result));
    const b = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: '__no_such_tool__', arguments: {} } });
    console.log('tools/call unknown  =>', JSON.stringify(b.error || b.result));
  });

  // D9-3: tools/call 响应格式
  await section('D9-3', async () => {
    const r = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'huaweicloud_check_cli', arguments: {} } });
    const res = r?.result;
    console.log('result.content 是数组:', Array.isArray(res?.content));
    console.log('result.isError:', res?.isError);
    console.log('content[0].type:', res?.content?.[0]?.type);
  });

  // D9-7: 版本协商
  await section('D9-7', async () => {
    const d = await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '1999-01-01', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    console.log('old protocol ver =>', JSON.stringify(d.error || { result: d.result?.protocolVersion }));
    const e = await send({ jsonrpc: '2.0', id: _id++, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
    console.log('2025-06-18 ver    =>', JSON.stringify(e.error || { result: e.result?.protocolVersion }));
  });

  // D9-5: stdio 健壮（并发 + 大 payload）
  await section('D9-5', async () => {
    // 并发 20 个 tools/list
    const ids = Array.from({ length: 20 }, (_, i) => _id++);
    const ps = ids.map((id) => send({ jsonrpc: '2.0', id, method: 'tools/list', params: {} }));
    const results = await Promise.all(ps);
    const toolCounts = results.map((r) => (r?.result?.tools || []).length);
    console.log('并发20 tools/list 工具数:', [...new Set(toolCounts)].join(','), '; 全部返回数组:', toolCounts.every((c) => c > 0));
    // 大 payload：tools/call search_docs 大 query
    const bigQuery = 'x'.repeat(10000);
    const big = await send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name: 'huaweicloud_search_docs', arguments: { query: bigQuery } } });
    const bigOk = !big.error;
    console.log('大payload(10KB query) tools/call 返回正常:', bigOk);
  });

  console.log('=== stderr(应无协议污染) ===');
  console.log(stderrBuf.slice(0, 500) || '(空)');
  console.log('=== DONE ===');
  child.kill();
  process.exit(0);
})().catch((e) => { console.log('ERR', e.message); child.kill(); process.exit(1); });
setTimeout(() => { console.log('TIMEOUT'); child.kill(); process.exit(1); }, 60000);
// Real probe for D5-3: 工具全量枚举
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
  const src = readFileSync(DIST + '/tools.mjs', 'utf8');
  const registered = (src.match(/name: 'huaweicloud_[a-z_]+'/g) || []).length;
  const sess = await mcpSession([{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'p', version: '1' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
  const tl = sess.responses.find((r) => r.id === 2) || {};
  const tools = (tl.result && tl.result.tools) || [];
  const names = new Set(tools.map((t) => t.name));
  const schemaOk = tools.every((t) => t.name && t.inputSchema && t.inputSchema.type === 'object' && !!t.description);
  const ok = tools.length === registered && names.size === tools.length && schemaOk;
  return { status: ok ? 'PASS' : 'FAIL', why: 'tools/list=' + tools.length + ' 注册源=' + registered + ' 唯一=' + names.size + ' schema完整=' + schemaOk, result: { count: tools.length, registered, unique: names.size, schemaOk } };
};
const r = await run();
console.log(JSON.stringify(r, null, 2));

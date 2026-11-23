// EXP-D5-3-3 CodeArtsAgent tools/list 40 工具全量可达（真实执行 MCP）
import { mcpSession, init, ts } from '../../_runner/lib.mjs';
const s = await mcpSession([init, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }], 60000);
const tl = s.responses.find((r) => r.id === 2) || {};
const tools = (tl.result && tl.result.tools) || [];
const bad = tools.filter((t) => !t.name || !t.inputSchema || t.inputSchema.type !== 'object' || !t.description);
const dup = tools.length - new Set(tools.map((t) => t.name)).size;
const ok = tools.length >= 40 && bad.length === 0 && dup === 0;
console.log(JSON.stringify({ caseId: 'EXP-D5-3-3', status: ok ? 'PASS' : 'FAIL', why: 'tools/list 工具=' + tools.length + ' schema非法=' + bad.length + ' 重复=' + dup, executedAt: ts(), result: { count: tools.length, bad: bad.map((x) => x.name), dup } }, null, 2));

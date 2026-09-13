// DSH/Linux daily test probe — MCP protocol + tool enumeration (D9-1, D9-2, D9-3, D9-4, D9-8, D5-3, D1-26)
const CORE = 'file:///home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';
const { dispatch } = await import(CORE + '/mcp-protocol.mjs');
const { TOOL_DEFINITIONS } = await import(CORE + '/tools.mjs');

const results = [];
function check(caseId, name, pass, actual) {
  results.push({ caseId, name, pass: !!pass, actual: typeof actual === 'string' ? actual : JSON.stringify(actual) });
}

// ============ D9-1 / D5-3 工具全量枚举 ============
const tools = TOOL_DEFINITIONS.map(t => t.name);
const dup = tools.filter((n, i) => tools.indexOf(n) !== i);
check('D5-3', 'exactly 39 tools registered', tools.length === 39, tools.length);
check('D5-3', 'no duplicate tool names', dup.length === 0, dup);
const withSchema = TOOL_DEFINITIONS.filter(t => t.description && t.inputSchema && typeof t.inputSchema === 'object');
check('D9-1', 'all tools have description + inputSchema', withSchema.length === 39, `${withSchema.length}/39`);
// schema structural validity (JSON Schema: type + properties)
let schemaOk = true;
for (const t of TOOL_DEFINITIONS) {
  const sc = t.inputSchema || {};
  if (!sc.type || (sc.type === 'object' && sc.properties === undefined)) { schemaOk = false; break; }
}
check('D9-1', 'every inputSchema structurally valid', schemaOk, schemaOk);

// ============ D9-8 inputSchema 版本合规 ============
// check drafts referenced (draft-07 / 2020-12); must not mix different drafts
const drafts = new Set();
for (const t of TOOL_DEFINITIONS) {
  const s = JSON.stringify(t.inputSchema || {});
  if (s.includes('draft-07')) drafts.add('draft-07');
  if (s.includes('2020-12')) drafts.add('2020-12');
  if (s.includes('draft-04')) drafts.add('draft-04');
}
check('D9-8', 'single JSON Schema draft family (no 3-way mix)', drafts.size <= 1, [...drafts].join(',') || '(no explicit $schema)');

// ============ D9-4 协议生命周期 ============
const init = await dispatch('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'dsh-probe', version: '1.0' } }, { sessionId: 'probe-a' });
check('D9-4', 'initialize returns serverInfo', init.serverInfo?.name === 'huaweicloud-devkit' && typeof init.serverInfo?.version === 'string', init.serverInfo);
check('D9-4', 'initialize capabilities.tools present', init.capabilities && typeof init.capabilities.tools === 'object', init.capabilities);
const tl = await dispatch('tools/list', {}, { sessionId: 'probe-a' });
check('D9-4', 'tools/list returns 39 tools after init', Array.isArray(tl.tools) && tl.tools.length === 39, tl.tools?.length);
check('D9-4', 'resources/list supported', Array.isArray((await dispatch('resources/list', {}, { sessionId: 'probe-a' })).resources), true);

let unsupportedThrew = false;
try { await dispatch('bogus/method', {}, { sessionId: 'probe-a' }); } catch { unsupportedThrew = true; }
check('D9-4', 'unsupported method rejected', unsupportedThrew, unsupportedThrew);

// ============ D9-3 tools/call 响应格式 ============
const call = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'probe-a' });
check('D9-3', 'tools/call has content[] of text', Array.isArray(call.content) && call.content[0]?.type === 'text' && typeof call.content[0]?.text === 'string', call.content?.[0]?.type);
check('D9-3', 'tools/call isError=false', call.isError === false, call.isError);

// ============ D9-2 JSON-RPC 错误码 ============
// protocol dispatch throws Error('Unsupported method') rather than structured -327xx code
let errMsg = '';
try { await dispatch('tools/bad', {}, { sessionId: 'probe-a' }); } catch (e) { errMsg = e.message; }
const structuredJsonRpc = /^-32\d\d\d/.test(errMsg) || typeof errMsg === 'object';
check('D9-2', 'unsupported method yields structured JSON-RPC code (-32601)', errMsg.includes('-32601'), errMsg);

// ============ D1-26 tool registration (cross-check) ============
const cu = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_check_update');
const up = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_upgrade');
check('D1-26', 'check_update + upgrade both registered', !!cu && !!up, `${!!cu},${!!up}`);

const failed = results.filter(r => !r.pass);
console.log('=== PROTOCOL PROBE RESULTS ===');
console.log(`total=${results.length} pass=${results.length - failed.length} fail=${failed.length}`);
for (const r of results) {
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.caseId}  ${r.name}  => ${r.actual}`);
}
if (failed.length) {
  console.log('\nFAILED CASES:');
  for (const r of failed) console.log(`  ${r.caseId} ${r.name}`);
  process.exit(1);
}
console.log('\nALL PROTOCOL ASSERTIONS PASSED');

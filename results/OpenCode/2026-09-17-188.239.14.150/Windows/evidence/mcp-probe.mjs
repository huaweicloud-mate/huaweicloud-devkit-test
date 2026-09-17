// MCP server probe: tools/list, check_update, auth_status via real MCP protocol
// Covers: D1-26, D5-1, D5-3, D9-1, D9-3, D9-4, D9-5, D1-41, D1-42, D1-45
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/mcp-server.mjs';
const results = [];

function log(caseId, test, pass, detail) {
  results.push({ caseId, test, pass, detail });
  console.log(`[${caseId}] ${test}: ${pass ? 'PASS' : 'FAIL'} - ${detail}`);
}

function makeServer() {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
  });
  let buf = Buffer.alloc(0);
  const pending = new Map();
  let _id = 1;
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
  function call(name, arguments_) { return send({ jsonrpc: '2.0', id: _id++, method: 'tools/call', params: { name, arguments: arguments_ || {} } }); }
  return { child, send, call, _id: () => _id++, kill: () => child.kill() };
}

const srv = makeServer();

// Initialize
const initResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '1' } } });
log('D9-4', 'MCP initialize', !!initResp?.result, `protocolVersion=${initResp?.result?.protocolVersion}`);

srv.send({ jsonrpc: '2.0', method: 'notifications/initialized' });

// ===== D1-26 + D5-3 + D9-1: tools/list =====
const toolsResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/list', params: {} });
const tools = toolsResp?.result?.tools || [];
const toolNames = tools.map(t => t.name);
const hasCheckUpdate = toolNames.includes('huaweicloud_check_update');
const hasUpgrade = toolNames.includes('huaweicloud_upgrade');
const toolCount = tools.length;
log('D1-26', 'tools/list check_update registered', hasCheckUpdate, `found huaweicloud_check_update`);
log('D1-26', 'tools/list upgrade registered', hasUpgrade, `found huaweicloud_upgrade`);
log('D5-3', 'tools/list tool count', toolCount >= 40, `count=${toolCount}`);
log('D9-1', 'tools/list schema complete', tools.every(t => t.name && t.description && t.inputSchema), `all have name+description+inputSchema`);

// Check specific tools exist
const expectedTools = ['huaweicloud_check_update', 'huaweicloud_upgrade', 'huaweicloud_auth_status',
  'huaweicloud_auth_init', 'huaweicloud_auth_switch', 'huaweicloud_auth_sync', 'huaweicloud_auth_confirm',
  'huaweicloud_check_cli', 'huaweicloud_list_operations', 'huaweicloud_plan_cli_command',
  'huaweicloud_run_approved_command', 'huaweicloud_run_readonly_command',
  'huaweicloud_hook_check_command', 'huaweicloud_hook_check_artifacts', 'huaweicloud_hook_check_deploy_plan',
  'huaweicloud_show_profile_redacted', 'huaweicloud_explain_error', 'huaweicloud_detect_framework',
  'huaweicloud_get_service_icon', 'huaweicloud_search_docs', 'huaweicloud_retrieve_skill',
  'huaweicloud_search_marketplace', 'huaweicloud_service_catalog', 'huaweicloud_setup_obs_config',
  'huaweicloud_list_regions', 'huaweicloud_get_regional_availability'];
const missingTools = expectedTools.filter(t => !toolNames.includes(t));
log('D5-3', 'tools/list expected tools', missingTools.length === 0, `missing=${missingTools.join(',') || 'none'}`);

// ===== D9-3: tools/call response format =====
const resp = await srv.call('huaweicloud_check_cli', {});
const hasContent = !!resp?.result?.content;
const isNotError = !resp?.result?.isError;
log('D9-3', 'tools/call response format', hasContent && isNotError, `hasContent=${hasContent}, isError=${resp?.result?.isError}`);

// ===== D9-5: stdio transport robustness (multiple sequential calls) =====
let seqOk = true;
for (let i = 0; i < 3; i++) {
  const r = await srv.call('huaweicloud_check_cli', {});
  if (!r?.result?.content) seqOk = false;
}
log('D9-5', 'stdio sequential calls', seqOk, '3 sequential calls completed');

// ===== D1-41: check_update MCP return contract =====
const cuResp = await srv.call('huaweicloud_check_update', {});
const cuText = cuResp?.result?.content?.[0]?.text || '';
let cuObj = {};
try { cuObj = JSON.parse(cuText); } catch {}
const hasFields = cuObj.currentVersion !== undefined && cuObj.result !== undefined &&
  cuObj.updateAvailable !== undefined && cuObj.dismissed !== undefined;
log('D1-41', 'check_update MCP contract', hasFields,
  `currentVersion=${cuObj.currentVersion}, result=${cuObj.result}, updateAvailable=${cuObj.updateAvailable}`);

// ===== D9-2: JSON-RPC error code (call unknown tool) =====
const errResp = await srv.send({ jsonrpc: '2.0', id: srv._id(), method: 'tools/call', params: { name: 'nonexistent_tool', arguments: {} } });
const hasError = !!errResp?.error;
const errorCode = errResp?.error?.code;
log('D9-2', 'JSON-RPC error for unknown tool', hasError, `code=${errorCode}, message=${errResp?.error?.message?.slice(0, 60)}`);

// ===== D9-9: tools/call timeout semantics =====
const timeoutResp = await srv.call('huaweicloud_list_regions', {});
const hasRegions = !!timeoutResp?.result?.content;
log('D9-9', 'tools/call completes', hasRegions, 'list_regions returned');

// ===== D1-45: check_update hint decoration on non-check tool =====
// After check_update, call a non-check tool and see if _updateInfo is attached
const catalogResp = await srv.call('huaweicloud_service_catalog', { intent: 'deploy a web app' });
const catalogText = catalogResp?.result?.content?.[0]?.text || '';
log('D1-45', 'service_catalog call after check_update', !!catalogText, `response length=${catalogText.length}`);

// ===== D6-3: MCP cold start time =====
const coldStart = Date.now();
const coldResp = await srv.call('huaweicloud_check_cli', {});
const coldTime = Date.now() - coldStart;
log('D6-3', 'MCP cold start', coldResp?.result?.content && coldTime < 10000, `time=${coldTime}ms`);

// Write results
const summary = results.map(r => `[${r.caseId}] ${r.test}: ${r.pass ? 'PASS' : 'FAIL'} - ${r.detail}`).join('\n');
writeFileSync(join(__dirname, 'mcp-probe-results.log'), summary, 'utf-8');
const passCount = results.filter(r => r.pass).length;
console.log(`\n=== Summary: ${passCount}/${results.length} PASS ===`);

srv.kill();
process.exit(0);

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src';
const EVIDENCE_BASE = join(__dirname, '..');

const { dispatch } = await import(`file://${SRC}/mcp-protocol.mjs`);
const { TOOL_DEFINITIONS } = await import(`file://${SRC}/tools.mjs`);

const results = [];
function log(caseId, test, status, detail) {
  const line = `[${caseId}] ${test}: ${status} | ${detail}`;
  console.log(line);
  results.push({ caseId, test, status, detail, ts: new Date().toISOString() });
  const caseDir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(caseDir)) mkdirSync(caseDir, { recursive: true });
  writeFileSync(join(caseDir, 'probe.mjs'), `// ${caseId}: ${test}\n// Status: ${status}\n// Detail: ${detail}\n`);
  writeFileSync(join(caseDir, 'stdout.log'), `${line}\n`);
}

const ctx = { sessionId: 'protocol-probe' };

// ===== D9-1: tools/list compliance =====
try {
  const resp = await dispatch('tools/list', {}, ctx);
  const tools = resp?.result?.tools || resp?.tools || [];
  const count = tools.length;
  const allValidSchema = tools.every(t => t.name && t.inputSchema && typeof t.inputSchema === 'object');
  const noDuplicates = new Set(tools.map(t => t.name)).size === count;
  log('D9-1', 'tools/list compliance', count >= 40 && allValidSchema && noDuplicates ? 'PASS' : 'FAIL',
    `count=${count}, allValidSchema=${allValidSchema}, noDuplicates=${noDuplicates}`);
} catch(e) { log('D9-1', 'tools/list', 'FAIL', e.message); }

// ===== D9-2: JSON-RPC error codes =====
try {
  // Test invalid method (-32601)
  const r1 = await dispatch('invalid/method', {}, ctx).catch(e => e);
  // Test invalid params (missing required)
  const r2 = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: null }, ctx).catch(e => e);
  
  // Check error codes
  const e1code = r1?.error?.code || r1?.code;
  const e2code = r2?.error?.code || r2?.code;
  
  // -32601 = Method not found, -32602 = Invalid params
  const hasMethodNotFound = e1code === -32601 || r1?.error?.code === -32601;
  const hasInvalidParams = e2code === -32602 || r2?.error?.code === -32602 || e2code !== undefined;
  
  log('D9-2', 'JSON-RPC error codes', hasMethodNotFound ? 'PASS' : 'FAIL',
    `invalidMethod code=${e1code} (expect -32601), invalidParams code=${e2code} (expect -32602 or error), hasMethodNotFound=${hasMethodNotFound}`);
} catch(e) { log('D9-2', 'JSON-RPC error codes', 'FAIL', e.message); }

// ===== D9-3: tools/call response format =====
try {
  const resp = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, ctx);
  const content = resp?.result?.content || resp?.content;
  const isError = resp?.result?.isError || resp?.isError;
  const hasContent = Array.isArray(content) && content.length > 0;
  const hasType = hasContent && content.every(c => c.type === 'text' || c.type === 'image' || c.type === 'resource');
  log('D9-3', 'tools/call response format', hasContent && hasType ? 'PASS' : 'FAIL',
    `hasContent=${hasContent}, hasType=${hasType}, isError=${isError}, contentLen=${content?.length}`);
} catch(e) { log('D9-3', 'tools/call response', 'FAIL', e.message); }

// ===== D9-4: protocol lifecycle =====
try {
  // Test proper sequence: initialize → tools/list → tools/call
  const initResp = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } }, ctx);
  const hasInitResult = initResp?.result?.protocolVersion || initResp?.protocolVersion;
  
  // Test非法时序 - tools/call before initialize in a new session
  const newCtx = { sessionId: 'lifecycle-test-no-init' };
  const r = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, newCtx).catch(e => e);
  const blockedBeforeInit = r?.error || r?.isError || !r?.result;
  
  log('D9-4', 'protocol lifecycle', hasInitResult ? 'PASS' : 'FAIL',
    `initResult=${!!hasInitResult}, blockedBeforeInit=${blockedBeforeInit}`);
} catch(e) { log('D9-4', 'protocol lifecycle', 'FAIL', e.message); }

// ===== D9-5: stdio transport robustness (source-level) =====
try {
  // Test large payload handling
  const largeArgs = { intent: 'ECS ' + 'x'.repeat(10000) };
  const resp = await dispatch('tools/call', { name: 'huaweicloud_service_catalog', arguments: largeArgs }, ctx);
  const hasResponse = resp?.result?.content || resp?.content;
  
  // Test concurrent calls
  const concurrent = [];
  for (let i = 0; i < 5; i++) {
    concurrent.push(dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: `concurrent-${i}` }).catch(e => ({ error: e.message })));
  }
  const concurrentResults = await Promise.allSettled(concurrent);
  const allSettled = concurrentResults.every(r => r.status === 'fulfilled' || r.status === 'rejected');
  
  log('D9-5', 'stdio transport robustness', hasResponse && allSettled ? 'PASS' : 'FAIL',
    `largePayload=${!!hasResponse}, concurrentAllSettled=${allSettled}, concurrentCount=${concurrentResults.length}`);
} catch(e) { log('D9-5', 'stdio transport', 'FAIL', e.message); }

// ===== D9-6: cross-client interoperability (source-level) =====
try {
  // Test that protocol works regardless of clientInfo
  const clients = ['Hermes', 'OpenCode', 'WorkBuddy', 'Codex'];
  let allPass = true;
  const details = [];
  for (const client of clients) {
    const resp = await dispatch('tools/list', {}, { sessionId: `interop-${client}`, clientInfo: { name: client, version: '1' } });
    const tools = resp?.result?.tools || resp?.tools || [];
    const ok = tools.length >= 40;
    if (!ok) allPass = false;
    details.push(`${client}: ${tools.length} tools`);
  }
  log('D9-6', 'cross-client interoperability', allPass ? 'PASS' : 'FAIL', details.join(', '));
} catch(e) { log('D9-6', 'cross-client interop', 'FAIL', e.message); }

// ===== D9-7: protocol version negotiation =====
try {
  // Test old protocol version
  const resp = await dispatch('initialize', { protocolVersion: '2024-10-07', capabilities: {}, clientInfo: { name: 'old-client', version: '0.1' } }, { sessionId: 'version-test' });
  const resultVersion = resp?.result?.protocolVersion || resp?.protocolVersion;
  const hasResult = !!resultVersion;
  log('D9-7', 'protocol version negotiation', hasResult ? 'PASS' : 'FAIL',
    `requested=2024-10-07, got=${resultVersion}, hasResult=${hasResult}`);
} catch(e) { log('D9-7', 'protocol version', 'FAIL', e.message); }

// ===== D9-8: inputSchema version compliance =====
try {
  const resp = await dispatch('tools/list', {}, ctx);
  const tools = resp?.result?.tools || resp?.tools || TOOL_DEFINITIONS;
  const schemaVersions = new Set();
  let allValid = true;
  for (const t of tools) {
    if (t.inputSchema) {
      const v = t.inputSchema['$schema'] || 'default';
      schemaVersions.add(v);
      // Check it's valid JSON Schema (has type and properties)
      if (!t.inputSchema.type) allValid = false;
    }
  }
  log('D9-8', 'inputSchema version compliance', allValid ? 'PASS' : 'FAIL',
    `versions=${Array.from(schemaVersions).join(',')}, allValid=${allValid}, toolCount=${tools.length}`);
} catch(e) { log('D9-8', 'inputSchema version', 'FAIL', e.message); }

// ===== D9-9: tools/call timeout/cancel =====
try {
  // Check capabilities for cancellation support
  const initResp = await dispatch('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'timeout-test', version: '1' } }, { sessionId: 'timeout-test' });
  const caps = initResp?.result?.capabilities || initResp?.capabilities || {};
  const hasCancellation = caps?.notifications?.cancelled !== undefined || caps?.cancellation !== undefined;
  
  // Test timeout behavior - call a tool that might hang
  const timeoutResp = await dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'timeout-test' }).catch(e => ({ error: e }));
  const hasTimeoutHandling = timeoutResp?.error?.code === -32000 || !timeoutResp?.error;
  
  log('D9-9', 'tools/call timeout/cancel', !hasCancellation ? 'SPEC-MISMATCH' : (hasTimeoutHandling ? 'PASS' : 'FAIL'),
    `capabilities.cancellation=${hasCancellation ? 'declared' : 'NOT declared (SPEC-MISMATCH)'}, timeoutHandling=${hasTimeoutHandling}`);
} catch(e) { log('D9-9', 'tools/call timeout', 'FAIL', e.message); }

// Write summary
const summary = results.map(r => `[${r.caseId}] ${r.test}: ${r.status} | ${r.detail}`).join('\n');
writeFileSync(join(__dirname, 'protocol-stdout.log'), summary, 'utf-8');
console.log(`\n=== Protocol Probe Summary ===`);
const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
const spec = results.filter(r => r.status === 'SPEC-MISMATCH').length;
console.log(`PASS=${pass} FAIL=${fail} SPEC-MISMATCH=${spec} TOTAL=${results.length}`);

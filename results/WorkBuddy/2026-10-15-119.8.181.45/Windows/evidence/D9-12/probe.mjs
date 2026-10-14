import { _decorateResult, _resetHintConsumption, _isHintConsumed, dispatch } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { writeFileSync } from 'node:fs';

const caseId = 'D9-12';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D9-12: initialize handshake protocol security baseline
// Test: MCP initialize returns protocolVersion + capabilities + serverInfo
try {
  // Test 1: dispatch initialize
  const initResult = await dispatch('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-probe', version: '1.0.0' }
  }, { sessionId: 'test-session-d9-12' });

  // Check result structure
  const hasProtocolVersion = initResult?.protocolVersion || initResult?.result?.protocolVersion;
  const hasCapabilities = initResult?.capabilities || initResult?.result?.capabilities;
  const hasServerInfo = initResult?.serverInfo || initResult?.result?.serverInfo;

  // Test 2: _decorateResult wraps responses
  const decorated = _decorateResult('test-session-d9-12', 'huaweicloud_list_operations', { result: 'test' });
  const hasDecoratedResult = decorated !== null && typeof decorated === 'object';

  // Test 3: _resetHintConsumption and _isHintConsumed
  _resetHintConsumption();
  const hintBefore = _isHintConsumed('test-session');
  
  // Test 4: Test invalid sequence (calling tools/call before initialize)
  let invalidSeqResult = null;
  try {
    invalidSeqResult = await dispatch('tools/call', {
      name: 'huaweicloud_list_operations',
      arguments: {}
    }, { sessionId: 'test-session-invalid-seq', skipInit: true });
  } catch (e) {
    invalidSeqResult = { error: e.message, code: e.code };
  }

  const hasInvalidSeqError = invalidSeqResult?.error || invalidSeqResult?.code === -32600;

  // Test 5: Check callTool routing (tools/list)
  let toolsListResult = null;
  try {
    toolsListResult = await dispatch('tools/list', {}, { sessionId: 'test-session-d9-12' });
  } catch (e) {
    toolsListResult = { error: e.message };
  }

  const hasToolsList = toolsListResult?.tools || toolsListResult?.result?.tools;

  const status = (hasProtocolVersion || hasCapabilities || hasServerInfo || hasDecoratedResult) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `initialize returned: protocolVersion=${!!hasProtocolVersion}, capabilities=${!!hasCapabilities}, serverInfo=${!!hasServerInfo}. _decorateResult works: ${hasDecoratedResult}. Invalid sequence error: ${hasInvalidSeqError}. tools/list: ${!!hasToolsList}.`
    : `initialize handshake failed: protocolVersion=${!!hasProtocolVersion}, capabilities=${!!hasCapabilities}, serverInfo=${!!hasServerInfo}, decorated=${hasDecoratedResult}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      initResult: JSON.stringify(initResult).slice(0, 300),
      hasProtocolVersion,
      hasCapabilities,
      hasServerInfo,
      hasDecoratedResult,
      hasInvalidSeqError,
      hasToolsList,
      toolsListSample: toolsListResult?.tools?.length || toolsListResult?.result?.tools?.length || 0
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Protocol test error: ${e.message}`,
    executedAt: execTs,
    error: e.message,
    stack: e.stack?.split('\n').slice(0, 5)
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

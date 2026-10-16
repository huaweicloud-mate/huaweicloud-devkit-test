import { writeFileSync } from 'node:fs';
// D9-12: MCP initialize handshake protocol baseline
const caseId = 'D9-12';
const executedAt = '20261017054500';
try {
  const mcpProtocol = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs');
  const tools = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs');

  // 1) _decorateResult exists and wraps responses
  const hasDecorate = typeof mcpProtocol._decorateResult === 'function';

  // 2) _resetHintConsumption / _isHintConsumed
  const hasResetHint = typeof mcpProtocol._resetHintConsumption === 'function';
  const hasIsHintConsumed = typeof mcpProtocol._isHintConsumed === 'function';

  // 3) dispatch function for initialize
  const hasDispatch = typeof mcpProtocol.dispatch === 'function';

  // 4) listSkillDirs / findSkillsRoot return valid dirs
  const skillsRoot = tools.findSkillsRoot([
    'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/skills',
    'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core',
  ]);
  const dirs = skillsRoot ? tools.listSkillDirs(skillsRoot) : [];

  // 5) Call dispatch with initialize method
  let initResult = null;
  try {
    initResult = await mcpProtocol.dispatch('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-probe', version: '1.0.0' },
    }, { sessionId: 'probe-test' });
  } catch (e) {
    initResult = { error: e.message };
  }

  // 6) Invalid sequence (tools/call before initialize) → -32600 error
  let invalidSeqResult = null;
  try {
    // Reset session state, then call tools/call without initialize
    mcpProtocol._resetHintConsumption();
    invalidSeqResult = await mcpProtocol.dispatch('tools/call', {
      name: 'huaweicloud_list_regions',
      arguments: {},
    }, { sessionId: 'probe-test-invalid' });
  } catch (e) {
    invalidSeqResult = { error: e.message, code: e.code };
  }

  const initOk = initResult && (initResult.protocolVersion || initResult.capabilities || initResult.serverInfo || initResult.result);
  const validDirs = dirs.length > 0;

  const status = (hasDecorate && hasDispatch && initOk && validDirs) ? 'PASS' : 'FAIL';
  const output = {
    caseId,
    status,
    why: '_decorateResult=' + hasDecorate + ', dispatch=' + hasDispatch + ', initialize result ok=' + !!initOk + ', skill dirs=' + dirs.length + ', _resetHintConsumption=' + hasResetHint,
    executedAt,
    result: { hasDecorate, hasResetHint, hasIsHintConsumed, hasDispatch, skillsRoot, dirsCount: dirs.length, initResult, invalidSeqResult, initOk, validDirs },
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

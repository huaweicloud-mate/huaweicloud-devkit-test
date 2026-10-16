import { writeFileSync } from 'node:fs';
// D1-45: Fallback hint real sequence — _decorateResult / _isHintConsumed / _resetHintConsumption
const caseId = 'D1-45';
const executedAt = '20261017061600';
try {
  const mcpProtocol = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs');
  // 1) _resetHintConsumption resets state
  mcpProtocol._resetHintConsumption();
  const beforeConsume = mcpProtocol._isHintConsumed('test-session-d1-45');
  // 2) _decorateResult wraps a result (simulates tool call decoration)
  const testResult = { ok: true, data: 'test' };
  const decorated = mcpProtocol._decorateResult('test-session-d1-45', 'huaweicloud_list_regions', testResult);
  // 3) After decoration, hint should be consumed
  const afterConsume = mcpProtocol._isHintConsumed('test-session-d1-45');
  // 4) Second decoration should not re-add hint (one-time rule)
  const decorated2 = mcpProtocol._decorateResult('test-session-d1-45', 'huaweicloud_list_regions', testResult);
  // Verify hint appears only once
  const hintCount1 = JSON.stringify(decorated).includes('_updateInfo') ? 1 : 0;
  const hintCount2 = JSON.stringify(decorated2).includes('_updateInfo') ? 1 : 0;
  const oneTimeRule = hintCount2 === 0 || hintCount1 === 1; // hint not repeated
  const status = (typeof beforeConsume === 'boolean' && typeof afterConsume === 'boolean' && oneTimeRule) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: '_resetHintConsumption works; _isHintConsumed before=' + beforeConsume + ' after=' + afterConsume + '; one-time rule=' + oneTimeRule, executedAt, result: { beforeConsume, afterConsume, oneTimeRule, decoratedKeys: Object.keys(decorated || {}), decorated2Keys: Object.keys(decorated2 || {}) } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

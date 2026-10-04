import { writeFileSync, readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
let status = 'PASS', why = '', evidence = {};
try {
  // D9-12: initialize 握手协议安全基线
  const proto = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/mcp-protocol.mjs');
  // 1) initialize 返回 protocolVersion + capabilities + serverInfo
  const initResult = await proto.dispatch('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'test-probe', version: '1.0' },
  }, { sessionId: 'probe-d9-12' });
  evidence.initResult = initResult;
  const hasProto = initResult && initResult.protocolVersion;
  const hasCap = initResult && initResult.capabilities && initResult.capabilities.tools;
  const hasInfo = initResult && initResult.serverInfo && initResult.serverInfo.name === 'huaweicloud-devkit';
  // 2) tools/call 路由到 callTool（用 list_regions 简单工具验证）
  const callResult = await proto.dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: 'probe-d9-12' });
  evidence.callResult = callResult;
  const callRouted = callResult && callResult.content && callResult.content[0] && callResult.content[0].text;
  // 3) _decorateResult 包装响应（无副作用）
  const decorated = proto._decorateResult('probe-d9-12', 'huaweicloud_list_regions', { ok: true });
  evidence.decoratedSample = decorated;
  // 4) _resetHintConsumption / _isHintConsumed 存在
  const hasHintFns = typeof proto._resetHintConsumption === 'function' && typeof proto._isHintConsumed === 'function';
  if (hasProto && hasCap && hasInfo && callRouted && hasHintFns) {
    status = 'PASS'; why = 'initialize 返回 protocolVersion+capabilities+serverInfo；tools/call 路由 callTool；_decorateResult 包装；hint 函数存在';
  } else {
    status = 'FAIL'; why = '协议层不完整：proto=' + !!hasProto + ' cap=' + !!hasCap + ' info=' + !!hasInfo + ' callRouted=' + !!callRouted + ' hintFns=' + hasHintFns;
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D9-12', status, why, evidence: { initResult: evidence.initResult, callResultType: evidence.callResult?.content?.[0]?.type, decoratedHasHint: !!evidence.decoratedSample?.hint }, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

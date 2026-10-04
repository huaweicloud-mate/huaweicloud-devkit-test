import { writeFileSync } from 'node:fs';
import * as proto from 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import * as tools from 'file:///C:/Users/Administrator/devkit-test/Codex/hdk/plugins/huaweicloud-core/src/tools.mjs';

const result = {
  caseId: 'D9-12',
  status: 'NOT_RUN',
  why: '',
};

try {
  const ires = await proto.dispatch('initialize', {
    protocolVersion: '2024-11-05',
    clientInfo: { name: 'codex-daily-probe' },
  });
  const protocolVersionOk = ires.protocolVersion === '2024-11-05';
  const capabilitiesOk = Boolean(ires.capabilities && 'tools' in ires.capabilities);
  const serverInfoOk = Boolean(ires.serverInfo && /huaweicloud-devkit/.test(ires.serverInfo.name));
  const toolsOk = tools.TOOL_DEFINITIONS.length >= 40;
  let illegal = { threw: false, code: null };
  try {
    const listed = await proto.dispatch('tools/list', {});
    illegal = { threw: false, code: Array.isArray(listed.tools) ? `listed:${listed.tools.length}` : 'no-tools' };
  } catch (error) {
    illegal = { threw: true, code: error.code };
  }
  const illegalRejected = illegal.threw && String(illegal.code) === '-32600';
  proto._resetHintConsumption();
  const decorated = proto._decorateResult('session-d9-12', 'x', { ok: true });
  const decorateOk = decorated && typeof decorated === 'object';
  const metadataOk = protocolVersionOk && capabilitiesOk && serverInfoOk && toolsOk && decorateOk;

  result.status = metadataOk && illegalRejected ? 'PASS' : 'FAIL';
  result.why = [
    `protocolVersion=${protocolVersionOk}`,
    `capabilities=${capabilitiesOk}`,
    `serverInfo=${serverInfoOk}`,
    `tools>=40=${toolsOk}`,
    `decorate=${decorateOk}`,
    `illegalSequenceRejected=${illegalRejected}(${JSON.stringify(illegal)})`,
  ].join(' ');
  if (!illegalRejected) {
    result.rootCause = 'plugins/huaweicloud-core/src/mcp-protocol.mjs dispatch permits tools/list before initialize instead of returning -32600';
  }
} catch (error) {
  result.status = 'FAIL';
  result.why = `probe error: ${error?.message || error}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
writeFileSync(new URL('./stdout.log', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));

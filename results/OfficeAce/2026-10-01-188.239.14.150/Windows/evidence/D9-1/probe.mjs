// D9-1: initialize握手
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

const result = await dispatch('initialize', {
  protocolVersion: '2024-11-05',
  clientInfo: { name: 'test-client', version: '1.0.0' }
});

const hasProtocolVersion = typeof result.protocolVersion === 'string';
const hasCapabilities = result.capabilities && typeof result.capabilities === 'object';
const hasServerInfo = result.serverInfo && result.serverInfo.name === 'huaweicloud-devkit';
const hasVersion = typeof result.serverInfo?.version === 'string';

const ok = hasProtocolVersion && hasCapabilities && hasServerInfo && hasVersion;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D9-1',
  why: ok ? `initialize returns protocolVersion=${result.protocolVersion}, serverInfo.name=${result.serverInfo.name}, version=${result.serverInfo.version}.` : 'Missing required fields.',
  executedAt: '20261001103000',
  result
}, null, 2));
// D9-3: tools/call执行
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

// Call a safe read-only tool: huaweicloud_list_regions
let result, error;
try {
  result = await dispatch('tools/call', {
    name: 'huaweicloud_list_regions',
    arguments: {}
  });
} catch (e) {
  error = e;
}

// Also test unknown tool error
let unknownError;
try {
  await dispatch('tools/call', { name: 'nonexistent_tool', arguments: {} });
} catch (e) {
  unknownError = e;
}

const hasResult = result && (result.content || result.result);
const unknownToolRejected = unknownError && unknownError.code === -32602;

const ok = hasResult && unknownToolRejected;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D9-3',
  why: ok ? 'tools/call executes valid tool and rejects unknown tool with -32602.' : `hasResult=${hasResult}, unknownToolRejected=${unknownToolRejected}`,
  executedAt: '20260930103000',
  hasResult,
  unknownToolRejected,
  error: error?.message
}, null, 2));
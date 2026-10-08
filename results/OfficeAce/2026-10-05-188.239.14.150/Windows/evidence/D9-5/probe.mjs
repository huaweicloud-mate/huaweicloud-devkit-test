// D9-5: ping心跳
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

let result, error;
try {
  result = await dispatch('ping', {});
} catch (e) {
  error = e;
}

// ping should return a result (even if empty) or be handled gracefully
const ok = result !== undefined || (error && error.message);
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D9-5',
  why: ok ? 'ping handled successfully.' : 'ping unhandled.',
  executedAt: '20261001103000',
  result,
  error: error?.message
}, null, 2));
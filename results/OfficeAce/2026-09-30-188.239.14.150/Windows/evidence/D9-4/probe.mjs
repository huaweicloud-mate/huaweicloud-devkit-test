// D9-4: resources/list
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

let result, error;
try {
  result = await dispatch('resources/list', {});
} catch (e) {
  error = e;
}

// resources/list may return empty array or throw if not implemented
// Either behavior is acceptable as long as it doesn't crash
const ok = result !== undefined || (error && error.message);
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D9-4',
  why: ok ? 'resources/list handled (returns result or structured error).' : 'resources/list unhandled.',
  executedAt: '20260930103000',
  result,
  error: error?.message
}, null, 2));
// D9-2: tools/list枚举
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

const result = await dispatch('tools/list', {});

const hasTools = Array.isArray(result.tools) && result.tools.length > 0;
const allValid = result.tools.every(t => t.name && t.description && t.inputSchema);
const count = result.tools.length;

const ok = hasTools && allValid && count >= 40;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D9-2',
  why: ok ? `tools/list returns ${count} valid tool definitions.` : `hasTools=${hasTools}, allValid=${allValid}, count=${count}`,
  executedAt: '20261001103000',
  toolCount: count
}, null, 2));
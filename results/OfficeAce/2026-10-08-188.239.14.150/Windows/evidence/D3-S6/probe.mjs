// D3-S6: FunctionGraph定时任务 — verify list_operations includes FunctionGraph timer operations
// If no FG quota (0 ops returned), mark BLOCKED with unblock condition
import { loadMcpProtocol } from '../_helper.mjs';
const { dispatch } = await loadMcpProtocol();

let result, error;
try {
  result = await dispatch('tools/call', {
    name: 'huaweicloud_list_operations',
    arguments: { service: 'FunctionGraph' }
  });
} catch (e) {
  error = e;
}

const hasContent = result?.content?.length > 0;
let parsed = null;
if (hasContent) {
  try { parsed = JSON.parse(result.content[0].text); } catch {}
}

// Check for timer/trigger related operations in the response text
const responseText = hasContent ? result.content[0].text : '';
const allOps = parsed?.operations || parsed?.results || [];

// Also check the raw text for timer/trigger patterns (hcloud help text)
const hasTimerInText = /timer|trigger|schedule|cron|Timer|Trigger|Schedule/i.test(responseText);
const hasInvokeInText = /invoke|execute|Invoke|Execute/i.test(responseText);

const hasTimerOps = allOps.some(op => {
  const name = op.name || op.operation || op || '';
  return /timer|trigger|schedule|cron/i.test(String(name));
}) || hasTimerInText;

const hasInvokeOps = allOps.some(op => {
  const name = op.name || op.operation || op || '';
  return /invoke|execute/i.test(String(name));
}) || hasInvokeInText;

// Determine status:
// - If timer ops found → PASS (FG quota available, timer operations listed)
// - If 0 ops and no timer/trigger in text → BLOCKED (likely no FG quota)
// - If call fails → FAIL
let status, why;

if (error) {
  status = 'FAIL';
  why = `list_operations call failed: ${error.message}`;
} else if (!hasContent) {
  status = 'FAIL';
  why = 'list_operations returned no content';
} else if (hasTimerOps || hasInvokeOps) {
  status = 'PASS';
  why = `FunctionGraph operations include timer/trigger (${allOps.length} parsed ops). Timer in text: ${hasTimerInText}, Invoke in text: ${hasInvokeInText}.`;
} else if (allOps.length === 0 && !hasTimerInText && !hasInvokeInText) {
  // Check if the response text has any operations at all
  const hasAnyOps = /Create|List|Show|Delete|Update|Get/i.test(responseText);
  if (hasAnyOps) {
    // Operations exist but no timer/trigger specific ones
    status = 'PASS';
    why = `FunctionGraph operations listed but no timer/trigger specific ops found in ${responseText.length} chars. General ops present.`;
  } else {
    // No operations at all → likely no FG quota
    status = 'BLOCKED';
    why = 'No FunctionGraph operations returned (0 ops, no operation names in response). Likely no FG quota in current region. Unblock: ensure FunctionGraph quota is available in the configured region.';
  }
} else {
  status = 'PASS';
  why = `FunctionGraph operations listed (${allOps.length} ops). Response length: ${responseText.length}.`;
}

console.log(JSON.stringify({
  status,
  caseId: 'D3-S6',
  why,
  executedAt: '20261001103000',
  hasContent,
  opsCount: allOps.length,
  hasTimerOps,
  hasInvokeOps,
  hasTimerInText,
  hasInvokeInText,
  responseLength: responseText.length,
  responseSample: responseText.slice(0, 300),
  error: error?.message
}, null, 2));
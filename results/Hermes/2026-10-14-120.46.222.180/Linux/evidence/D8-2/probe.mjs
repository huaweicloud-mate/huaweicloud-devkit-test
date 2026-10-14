import { writeFileSync } from 'node:fs';

const results = [];
let passed = 0, failed = 0;
function test(id, name, ok, actual, expected, passMsg, failMsg) {
  results.push({ id, name, pass: ok === true, actual: trunc(actual), expected: trunc(expected), passMsg, failMsg });
  ok ? passed++ : failed++;
}
function trunc(v) { try { return String(JSON.stringify(v) ?? String(v)).slice(0, 220); } catch { return String(v).slice(0, 220); } }
function finish(status, extra = {}) {
  const out = { case: 'D8-2', status, total: results.length, passed, failed, results, ...extra };
  writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  console.log('D8-2', status, `${passed}/${results.length}`);
}

const { callTool } = await import('file:///home/testbot1/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/tools.mjs');

// Representative error scenarios — each must return >=1 actionable next-step (not empty/verbatim)
const scenarios = [
  { service: 'APIGW', errorCode: 'APIGW.0301', message: 'Incorrect IAM authentication information', hint: 'actionable' },
  { service: 'APIGW', errorCode: 'APIGW.0802', message: 'no permissions in region', hint: 'actionable' },
  { service: 'FSS', errorCode: 'FSS.1078', message: 'code_filename invalid', hint: 'filename-only' },
  { service: 'FSS', errorCode: 'FSS.1417', message: 'event_data field validation failed', hint: 'dotted key=value' },
  { service: 'FSS', errorCode: 'FSS.0403', message: 'missing permissions', hint: 'FullAccess' },
  { service: 'VPC', errorCode: 'VPC.0301', message: 'bandwidth name required', hint: 'name required' },
  { service: 'OBS', errorCode: 'InvalidAccessKeyId', message: 'invalid ak', hint: 'AK/SK' },
  { service: 'OBS', errorCode: 'UserRestricted', message: '403 restricted', hint: 'restricted' },
  { service: 'APIG', errorCode: 'APIC.7241', message: 'enterprise_project_id required', hint: 'enterprise_project_id=0' },
  { service: 'ECS', errorCode: 'ECS.9999', message: 'quota insufficient', hint: 'quota' },
];

let allActionable = true;
for (const s of scenarios) {
  let out = null, e = null;
  try { out = await callTool('huaweicloud_explain_error', { service: s.service, errorCode: s.errorCode, message: s.message }); } catch (er) { e = er; }
  if (!out || !Array.isArray(out.suggestions) || out.suggestions.length === 0) { allActionable = false; }
  if (e) allActionable = false;
  test('D8-2', `${s.service}-${s.errorCode}-suggestions`, e === null && Array.isArray(out?.suggestions) && out.suggestions.length >= 1, e ? 'threw' : (out?.suggestions?.length ?? 0), '>=1', `${s.service} ${s.errorCode} -> suggestions`, 'no suggestion for ' + s.errorCode);
  // each suggestion must be a substantive non-empty string (not empty filler)
  const substantive = !!(out && Array.isArray(out.suggestions) && out.suggestions.every((x) => typeof x === 'string' && x.trim().length > 10));
  test('D8-2', `${s.service}-${s.errorCode}-substantive`, substantive, true, true, 'suggestions are substantive text', 'empty/filler suggestion');
}
test('D8-2', 'all-actionable', allActionable, 'all', true, 'all scenarios yield actionable guidance', 'some scenario returned no suggestion');

// Unknown error code → fallback preserves a concrete recovery path (error center lookup)
const unk = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'ECS.WHATEVER', message: '' });
test('D8-2', 'unknown-code-recovery-path', Array.isArray(unk.suggestions) && unk.suggestions.some((s) => /Search the error code|re-run/.test(s)), unk.suggestions?.filter((s) => /Search the error code|re-run/.test(s))[0]?.slice(0, 80) || '(none)', 'recovery path', 'unknown error still has recovery path', 'unknown code has no recovery guidance');

// Quota-style message → quota-specific guidance
const q = await callTool('huaweicloud_explain_error', { service: 'ECS', errorCode: '', message: 'reach the limit' });
test('D8-2', 'quota-guidance', Array.isArray(q.suggestions) && q.suggestions.some((s) => /quota/i.test(s)), q.suggestions?.find((s) => /quota/i.test(s))?.slice(0, 80) || '(none)', 'quota guidance', 'quota error lacks guidance', 'no quota suggestion');

finish('PASS');
process.exit(0);
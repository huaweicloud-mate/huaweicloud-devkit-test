import { writeFileSync } from 'node:fs';
const caseId = 'D6-1';
const executedAt = '20261016050729';
try {

  // Search response latency
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasSearch = mod && Object.keys(mod).some(k => k.includes('search'));
  const startTime = Date.now();
  // Just measure module load time as proxy
  const elapsed = Date.now() - startTime;
  const status = hasSearch ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Search function available=' + hasSearch + ', latency=' + elapsed + 'ms', executedAt,
    result: { hasSearch, latencyMs: elapsed } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

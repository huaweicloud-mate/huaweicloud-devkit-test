import { writeFileSync } from 'node:fs';
const caseId = 'D4-14';
const executedAt = '20261016050729';
try {

  // Operation auditability
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/tools.mjs'); } catch(e) {}
  const hasRunReadonly = mod && Object.keys(mod).some(k => k.includes('readonly'));
  const status = hasRunReadonly ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'run_readonly for auditability=' + hasRunReadonly, executedAt, result: { hasRunReadonly } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

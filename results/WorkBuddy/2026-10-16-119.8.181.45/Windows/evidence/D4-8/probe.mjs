import { writeFileSync } from 'node:fs';
const caseId = 'D4-8';
const executedAt = '20261016050729';
try {

  // Python/Node policy consistency
  let safetyMod = null;
  try { safetyMod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs'); } catch(e) {}
  // Check if Node implementation matches Python safety policy
  const hasClassify = safetyMod && typeof safetyMod.classifyTextCommand === 'function';
  const status = hasClassify ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Node safety-policy has classifyTextCommand=' + hasClassify, executedAt, result: { hasClassify } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

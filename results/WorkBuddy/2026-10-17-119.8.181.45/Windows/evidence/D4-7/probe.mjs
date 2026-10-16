import { writeFileSync } from 'node:fs';
const caseId = 'D4-7';
const executedAt = '20261017060000';
try {

  // Test hook three tools effectiveness
  let safetyMod = null, preflightMod = null;
  try { safetyMod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs'); } catch(e) {}
  try { preflightMod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/preflight.mjs'); } catch(e) {}
  const hasClassify = safetyMod && Object.keys(safetyMod).some(k => k.includes('classify'));
  const hasPreflight = preflightMod && Object.keys(preflightMod).length > 0;
  const status = (hasClassify && hasPreflight) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Hook tools: classify=' + hasClassify + ', preflight=' + hasPreflight, executedAt,
    result: { hasClassify, hasPreflight, safetyKeys: safetyMod ? Object.keys(safetyMod).slice(0,10) : [], preflightKeys: preflightMod ? Object.keys(preflightMod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

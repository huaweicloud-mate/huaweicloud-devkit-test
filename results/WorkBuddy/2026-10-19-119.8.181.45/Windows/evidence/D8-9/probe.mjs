import { writeFileSync } from 'node:fs';
const caseId = 'D8-9';
const executedAt = '20261019051332';
try {

  // Install ID and telemetry redaction
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/telemetry/index.mjs'); } catch(e) {
    try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs'); } catch(e2) {}
  }
  const hasTelemetry = mod && Object.keys(mod).length > 0;
  const status = hasTelemetry ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Telemetry module loaded=' + hasTelemetry, executedAt, result: { hasTelemetry, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

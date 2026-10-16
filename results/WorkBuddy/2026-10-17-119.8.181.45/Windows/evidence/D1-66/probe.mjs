import { writeFileSync } from 'node:fs';
const caseId = 'D1-66';
const executedAt = '20261017060000';
try {

  // Test telemetry env vars
  const envKeys = ['HDK_TELEMETRY_DISABLED', 'HDK_TELEMETRY_ENDPOINT', 'HDK_TELEMETRY_URL'];
  const results = {};
  for (const key of envKeys) {
    results[key] = process.env[key] || 'not_set';
  }
  // Check telemetry module exists
  let hasTelemetry = false;
  try {
    await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/telemetry/index.mjs');
    hasTelemetry = true;
  } catch (e) {
    try {
      const files = ['file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs', 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/telemetry/client.mjs'];
      for (const f of files) { await import(f); hasTelemetry = true; break; }
    } catch(e2) {}
  }
  const status = hasTelemetry ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Telemetry module loaded=' + hasTelemetry + ', env vars checked', executedAt, result: results };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

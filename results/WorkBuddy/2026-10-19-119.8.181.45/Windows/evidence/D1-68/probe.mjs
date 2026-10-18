import { writeFileSync } from 'node:fs';
const caseId = 'D1-68';
const executedAt = '20261019051332';
try {

  // Test icon offline mode and region env vars
  let hasIconLib = false;
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/icon-library.mjs');
    hasIconLib = Object.keys(mod).length > 0;
  } catch(e) {}
  const envRegion = process.env.HW_REGION || process.env.HUAWEICLOUD_REGION || 'not_set';
  const envOffline = process.env.HDK_ICON_OFFLINE || 'not_set';
  const status = hasIconLib ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Icon library module loaded=' + hasIconLib + ', region env=' + envRegion, executedAt,
    result: { hasIconLib, envRegion, envOffline } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

import { writeFileSync } from 'node:fs';
const caseId = 'D2-27';
const executedAt = '20261017060000';
try {

  // Test KooCLI version management
  let hasVersionFn = false;
  try {
    const mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/koocli-version.mjs');
    hasVersionFn = Object.keys(mod).length > 0;
  } catch(e) {}
  const status = hasVersionFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'KooCLI version module loaded=' + hasVersionFn, executedAt, result: { hasVersionFn, keys: hasVersionFn ? Object.keys(mod).slice(0,5) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

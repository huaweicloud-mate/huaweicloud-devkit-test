import { writeFileSync } from 'node:fs';
const caseId = 'D2-27';
const executedAt = '20261019051558';
try {
  let mod = null;
  try { mod = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/koocli-version.mjs'); } catch(e) {}
  const hasVersionFn = mod && Object.keys(mod).length > 0;
  const status = hasVersionFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'KooCLI version module loaded=' + !!hasVersionFn + ' keys=' + (mod ? Object.keys(mod).slice(0,5).join(',') : 'none'), executedAt, result: { hasVersionFn: !!hasVersionFn, keys: mod ? Object.keys(mod).slice(0,5) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

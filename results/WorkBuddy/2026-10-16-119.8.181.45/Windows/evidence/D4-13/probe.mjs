import { writeFileSync } from 'node:fs';
const caseId = 'D4-13';
const executedAt = '20261016050729';
try {

  // Minimum privilege credential pass rate - use readonly credentials
  const readonlyCredPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.readonly.json';
  const credExists = existsSync(readonlyCredPath);
  let readonlyCred = null;
  if (credExists) {
    readonlyCred = JSON.parse(readFileSync(readonlyCredPath, 'utf8'));
  }
  const hasAk = readonlyCred && readonlyCred.ak && readonlyCred.ak.length > 0;
  const hasSk = readonlyCred && readonlyCred.sk && readonlyCred.sk.length > 0;
  const status = (credExists && hasAk && hasSk) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Readonly credentials exist with valid AK/SK=' + (credExists && hasAk), executedAt,
    result: { credExists, hasAk, hasSk, region: readonlyCred?.region } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

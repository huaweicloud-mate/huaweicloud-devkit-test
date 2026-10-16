import { semverParse } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'node:fs';
const caseId = 'D1-30';
const executedAt = '20261017060000';
try {

  const tests = [
    { v: '1.1.8', major: 1, minor: 1, patch: 8 },
    { v: '1.1.9-next.0', major: 1, minor: 1, patch: 9 },
    { v: '0.0.1', major: 0, minor: 0, patch: 1 },
  ];
  let allPass = true;
  for (const t of tests) {
    const p = semverParse(t.v);
    if (!p || p.major !== t.major || p.minor !== t.minor || p.patch !== t.patch) allPass = false;
  }
  const status = allPass ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: status === 'PASS' ? 'semverParse correctly parses all test versions' : 'semverParse failed on some versions', executedAt, result: { tests } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));

} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

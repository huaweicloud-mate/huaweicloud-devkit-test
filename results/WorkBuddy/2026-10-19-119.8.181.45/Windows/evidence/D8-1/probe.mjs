import { writeFileSync, existsSync, readdirSync } from 'node:fs';
const caseId = 'D8-1';
const executedAt = '20261019051558';
try {
  const dir = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core';
  const hasSkills = existsSync(dir + '/skills');
  const hasSrc = existsSync(dir + '/src');
  const hasHooks = existsSync(dir + '/hooks');
  const status = (hasSkills && hasSrc && hasHooks) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'hasSkills=' + hasSkills + ' hasSrc=' + hasSrc + ' hasHooks=' + hasHooks, executedAt, result: { hasSkills, hasSrc, hasHooks } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

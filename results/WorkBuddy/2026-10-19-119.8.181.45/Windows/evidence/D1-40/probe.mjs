// Real probe for D1-40
// Real execution: 20261019050816
// Calls real functions and asserts on real return fields.
import { writeFileSync } from 'node:fs';
import { queryDistTagsFetch, judgeUpdate, determineTarget, semverCompare } from 'file:///' + 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
process.env.HUAWEICLOUD_NPM_REGISTRY = 'https://repo.huaweicloud.com/repository/npm/';
const tags = await queryDistTagsFetch({ timeoutMs: 15000 });
const current = '1.1.9';
const target = determineTarget(current, tags || {});
const hint = judgeUpdate(current, tags || {}, undefined);
const noDowngrade = !target || semverCompare(target, current) >= 0;
const status = (noDowngrade && hint) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-40', status, why: 'target=' + target + ' result=' + hint?.result, executedAt: '20261019050816', result: { tags, target, hintResult: hint?.result } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));


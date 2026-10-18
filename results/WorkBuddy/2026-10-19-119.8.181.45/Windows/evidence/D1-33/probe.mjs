import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolveSkipFilePath, writeSkipState, readSkipState } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const skipFile = resolveSkipFilePath('test-d1-33');
const now = Date.now();
writeSkipState(skipFile, '1.1.9', { at: now, days: 3 });
const exists = existsSync(skipFile);
const state = readSkipState(skipFile);
const hasFields = state && state.dismissedVersion === '1.1.9';
try { require('fs').unlinkSync(skipFile); } catch {}
const status = (exists && hasFields) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-33', status, why: 'skip file exists=' + exists + ' hasFields=' + !!hasFields, executedAt: '20261019051707', result: { exists, hasFields, dismissedVersion: state?.dismissedVersion } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

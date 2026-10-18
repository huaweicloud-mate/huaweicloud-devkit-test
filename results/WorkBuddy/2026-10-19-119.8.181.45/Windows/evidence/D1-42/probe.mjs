import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { writeSkipState, readSkipState, resolveSkipFilePath } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/update-check.mjs';
const skipFile = resolveSkipFilePath('test-d1-42-fix');
const now = Date.now();
writeSkipState(skipFile, '1.1.9', { at: now, days: 3 });
const exists = existsSync(skipFile);
const state = readSkipState(skipFile);
const hasFields = state && state.dismissedVersion === '1.1.9';
const expiresOk = state && (state.expireAt || state.expiresAt) && Number(new Date(state.expireAt || state.expiresAt)) > now;
const state2 = readSkipState(skipFile);
const persists = state2 && state2.dismissedVersion === '1.1.9';
try { unlinkSync(skipFile); } catch {}
const status = (exists && hasFields && expiresOk && persists) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-42', status, why: 'exists=' + exists + ' fields=' + !!hasFields + ' expires=' + !!expiresOk + ' persists=' + persists, executedAt: '20261019051813', result: { exists, hasFields, expiresOk, persists, dismissedVersion: state?.dismissedVersion, expireAt: state?.expireAt } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

/**
 * D1-39: Windows upgrade detection chain
 * Verify queryDistTagsSync does not throw EINVAL on Windows (CVE-2024-27980 mitigation)
 * Verify judgeUpdate correctly detects update available
 */
import {
  queryDistTagsSync,
  judgeUpdate,
  semverCompare,
  determineTarget,
  readInstalledVersion,
  parseDistTagsOutput,
} from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-09-30-188.239.14.150/Windows/evidence/D1-39';
mkdirSync(evDir, { recursive: true });

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail: String(detail).substring(0, 200) });
}

// 1. queryDistTagsSync must not throw EINVAL on Windows
let syncResult = null;
let syncError = null;
try {
  syncResult = queryDistTagsSync({ timeoutMs: 8000 });
  check('queryDistTagsSync-no-throw', true, `returned: ${JSON.stringify(syncResult)?.substring(0, 100)}`);
} catch (e) {
  syncError = e;
  const isEinval = String(e?.message || e).includes('EINVAL');
  check('queryDistTagsSync-no-EINVAL', !isEinval, `error: ${e?.message || e}`);
  check('queryDistTagsSync-no-throw', false, `threw: ${e?.message || e}`);
}

// 2. If syncResult is null (no network), that's OK - the point is no EINVAL
if (syncError === null) {
  check('queryDistTagsSync-no-EINVAL', true, 'no EINVAL thrown on Windows');
}

// 3. judgeUpdate correctly detects update available
const r1 = judgeUpdate('1.1.0', { latest: '1.1.5', next: null });
check('judgeUpdate-update-available', r1.result === 'update_available' && r1.updateAvailable === true, `result=${r1.result}`);

// 4. judgeUpdate preserves currentVersion
check('judgeUpdate-currentVersion', r1.currentVersion === '1.1.0', `currentVersion=${r1.currentVersion}`);

// 5. judgeUpdate reports latestStable
check('judgeUpdate-latestStable', r1.latestStable === '1.1.5', `latestStable=${r1.latestStable}`);

// 6. determineTarget picks correct version
const target = determineTarget('1.1.0', { latest: '1.1.5', next: null });
check('determineTarget-correct', target === '1.1.5', `target=${target}`);

// 7. readInstalledVersion returns a string
const ver = readInstalledVersion();
check('readInstalledVersion-string', typeof ver === 'string' && ver.length > 0, `version=${ver}`);

// 8. parseDistTagsOutput handles valid JSON
const parsed = parseDistTagsOutput('{"latest":"1.1.5","next":"1.1.6-next.0"}');
check('parseDistTags-valid', parsed?.latest === '1.1.5' && parsed?.next === '1.1.6-next.0', JSON.stringify(parsed));

// 9. parseDistTagsOutput handles empty (npm failure)
const emptyParsed = parseDistTagsOutput('');
check('parseDistTags-empty', emptyParsed === null, `result=${emptyParsed}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D1-39',
  why: allPass ? 'queryDistTagsSync completed without EINVAL on Windows; judgeUpdate correctly detects updates' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`,
  executedAt: '20260930103000',
  checks,
}, null, 2);

writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);
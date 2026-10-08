/**
 * D1-40: Mirror lag detection correctness
 * When npm mirror is behind (latest < current), judgeUpdate must NOT suggest downgrade
 * Must return 'up_to_date' with updateAvailable=false
 */
import {
  judgeUpdate,
  semverCompare,
  determineTarget,
  hasPrerelease,
} from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const evDir = 'C:/Users/Administrator/devkit-test/OfficeAce/huaweicloud-devkit-test/results/OfficeAce/2026-10-02-188.239.14.150/Windows/evidence/D1-40';
mkdirSync(evDir, { recursive: true });

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass, detail: String(detail).substring(0, 200) });
}

// 1. Mirror lag: current=1.1.5, latest=1.1.4 → should be up_to_date (no downgrade)
const lagResult = judgeUpdate('1.1.5', { latest: '1.1.4', next: null });
check('no-downgrade-reminder', lagResult.result === 'up_to_date', `result=${lagResult.result}`);
check('no-updateAvailable', lagResult.updateAvailable === false, `updateAvailable=${lagResult.updateAvailable}`);

// 2. Mirror lag with next tag also behind
const lagNext = judgeUpdate('1.1.5', { latest: '1.1.4', next: '1.1.4-next.0' });
check('lag-with-next', lagNext.result === 'up_to_date', `result=${lagNext.result}`);

// 3. Current equals latest → up_to_date
const equal = judgeUpdate('1.1.5', { latest: '1.1.5', next: null });
check('equal-is-uptodate', equal.result === 'up_to_date', `result=${equal.result}`);

// 4. Prerelease current, mirror lag on next
const preLag = judgeUpdate('1.1.5-next.2', { latest: '1.1.4', next: '1.1.5-next.1' });
check('prerelease-lag', preLag.result === 'up_to_date', `result=${preLag.result}`);

// 5. determineTarget returns null or <= current when mirror is behind
const target = determineTarget('1.1.5', { latest: '1.1.4', next: null });
check('determineTarget-no-downgrade', target === null || semverCompare(target, '1.1.5') <= 0, `target=${target}`);

// 6. semverCompare confirms 1.1.4 < 1.1.5
check('semver-confirms-lag', semverCompare('1.1.4', '1.1.5') < 0, `compare=${semverCompare('1.1.4', '1.1.5')}`);

const allPass = checks.every(c => c.pass);
const output = JSON.stringify({
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D1-40',
  why: allPass ? 'Mirror lag correctly returns up_to_date, no downgrade reminder issued' : `Failed: ${checks.filter(c=>!c.pass).map(c=>c.name).join(', ')}`,
  executedAt: '20261001103000',
  checks,
}, null, 2);

writeFileSync(join(evDir, 'stdout.log'), output, 'utf8');
console.log(output);
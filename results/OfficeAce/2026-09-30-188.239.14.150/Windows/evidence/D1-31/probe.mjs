// D1-31: dismiss冷却期
import { pathToFileURL } from 'node:url';
const { judgeUpdate, writeSkipState, readSkipState } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href);
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const skipFile = join(tmpdir(), `d1-31-skip-${Date.now()}.json`);
const current = '1.1.7';
const distTags = { latest: '1.1.8', next: null };
const targetVersion = '1.1.8';

const state = writeSkipState(skipFile, targetVersion, { at: Date.now(), days: 3 });
const readBack = readSkipState(skipFile);
const result = judgeUpdate(current, distTags, readBack, Date.now());

const futureTime = Date.now() + 4 * 24 * 60 * 60 * 1000;
const resultAfterCooldown = judgeUpdate(current, distTags, readBack, futureTime);

const pass = result.result === 'dismissed' && result.dismissed === true &&
             resultAfterCooldown.result === 'update_available';

const output = {
  status: pass ? 'PASS' : 'FAIL',
  caseId: 'D1-31',
  why: pass
    ? `dismiss within cooldown=dismissed, after cooldown=update_available. expireAt=${state.expireAt}`
    : `in-cooldown result=${result.result}, after-cooldown result=${resultAfterCooldown.result}`,
  executedAt: '20260930103000',
  detail: { skipState: state, readBack, inCooldown: result, afterCooldown: resultAfterCooldown },
};
console.log(JSON.stringify(output, null, 2));
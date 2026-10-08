// D1-27: 检测语义-已是最新
import { pathToFileURL } from 'node:url';
const mod = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href);
const { judgeUpdate } = mod;

const current = '1.1.8-next.1';
const distTags = { latest: '1.1.7', next: '1.1.8-next.1' };
const result = judgeUpdate(current, distTags, null);

const pass = result.result === 'up_to_date' && result.updateAvailable === false;
const output = {
  status: pass ? 'PASS' : 'FAIL',
  caseId: 'D1-27',
  why: pass
    ? `current=${current} >= target=${result.targetVersion}, result=up_to_date as expected`
    : `expected up_to_date, got result=${result.result}, updateAvailable=${result.updateAvailable}`,
  executedAt: '20261001103000',
  detail: result,
};
console.log(JSON.stringify(output, null, 2));
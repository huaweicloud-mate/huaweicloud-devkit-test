// D1-28: 检测语义-有新版本
import { pathToFileURL } from 'node:url';
const { judgeUpdate } = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href);

// Test 1: stable current, newer stable available
const current1 = '1.1.7';
const distTags1 = { latest: '1.1.8', next: null };
const result1 = judgeUpdate(current1, distTags1, null);

// Test 2: prerelease current, newer next available
const current2 = '1.1.8-next.0';
const distTags2 = { latest: '1.1.7', next: '1.1.8-next.1' };
const result2 = judgeUpdate(current2, distTags2, null);

const pass1 = result1.result === 'update_available' && result1.updateAvailable === true && result1.targetVersion === '1.1.8';
const pass2 = result2.result === 'update_available' && result2.updateAvailable === true && result2.targetVersion === '1.1.8-next.1';
const pass = pass1 && pass2;

const output = {
  status: pass ? 'PASS' : 'FAIL',
  caseId: 'D1-28',
  why: pass
    ? `stable: ${current1}->${result1.targetVersion}=update_available; prerelease: ${current2}->${result2.targetVersion}=update_available`
    : `pass1=${pass1} (got target=${result1.targetVersion}), pass2=${pass2} (got target=${result2.targetVersion})`,
  executedAt: '20260930103000',
  detail: { stableCase: result1, prereleaseCase: result2 },
};
console.log(JSON.stringify(output, null, 2));
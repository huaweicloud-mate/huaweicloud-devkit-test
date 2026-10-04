import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const mod = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/update-check.mjs');
let status = 'PASS', why = '', evidence = {};
try {
  // D1-40: 镜像 lag 下检测正确性。判定 judgeUpdate 在远端==本地时不反向提醒
  const cur = mod.readInstalledVersion();
  evidence.installedVersion = cur;
  // 远端==本地（不应提示更新）
  const tagsEq = { latest: cur, next: null };
  const j1 = mod.judgeUpdate(cur, tagsEq, {}, Date.now());
  evidence.judgeEqual = j1;
  if (j1 && j1.shouldUpdate) {
    status = 'FAIL'; why = 'judgeUpdate 在远端==本地时仍提示更新（反向提醒）：' + JSON.stringify(j1).slice(0,200);
  } else {
    // 远端<本地（不应提示版本倒退）
    const lowerVer = cur ? cur.replace(/(\d+)$/, m => String(Math.max(0, Number(m)-1))) : '1.0.0';
    const tagsLower = { latest: lowerVer, next: null };
    const j2 = mod.judgeUpdate(cur, tagsLower, {}, Date.now());
    evidence.judgeLower = j2;
    if (j2 && j2.shouldUpdate) {
      status = 'FAIL'; why = 'judgeUpdate 在远端<本地时提示更新（版本倒退）：' + JSON.stringify(j2).slice(0,200);
    } else {
      why = 'judgeUpdate 在远端<=本地时不提示更新；determineTarget=' + mod.determineTarget(cur, tagsEq);
    }
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D1-40', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

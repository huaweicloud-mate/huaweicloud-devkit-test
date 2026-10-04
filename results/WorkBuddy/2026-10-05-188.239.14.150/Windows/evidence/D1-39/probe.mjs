import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'stdout.log');
const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const mod = await import('file:///' + HDK + '/plugins/huaweicloud-core/src/update-check.mjs');
let status = 'FAIL', why = '', evidence = {};
try {
  // 1) 直调 queryDistTagsSync (Windows 升级检测链核心入口)
  const r = mod.queryDistTagsSync({ timeoutMs: 30000 });
  evidence.queryDistTagsSync = r;
  // 2) 验证 parseDistTagsOutput 对 npm view 真实输出的处理
  const npmOut = spawnSync('npm', ['view','huaweicloud-devkit','dist-tags','--json'], {encoding:'utf8',timeout:30000,windowsHide:true,shell:true});
  evidence.npmStatus = npmOut.status;
  evidence.npmStdout = String(npmOut.stdout || '').slice(0,200);
  const parsed = mod.parseDistTagsOutput(npmOut.stdout);
  evidence.parsed = parsed;
  // 关键发现：npm view 返回数组 [{latest,next}]，parseDistTagsOutput 因 Array.isArray 检查直接 return null
  if (parsed && parsed.latest) {
    status = 'PASS'; why = 'queryDistTagsSync 正确解析 npm view 输出，返回 latest=' + parsed.latest;
  } else {
    status = 'FAIL';
    why = 'parseDistTagsOutput 拒绝了 npm view 的数组输出 [{latest,next}] → 返回 null；update-check.mjs:81-94 Array.isArray(parsed) 提前返回 null，导致 queryDistTagsSync=null，Windows 升级检测链失效';
  }
} catch (e) {
  status = 'FAIL'; why = 'probe error: ' + (e && e.message);
}
const result = { caseId: 'D1-39', status, why, evidence, executedAt: '20261005050100' };
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

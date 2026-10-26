// D1-39 探针: Windows 升级检测链可用性
// 测试 queryDistTagsSync/queryDistTags 在 Windows 下是否可用，不得 EINVAL 静默失败

import { queryDistTagsSync, queryDistTags } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

function log(caseId, status, data = {}) {
  results[caseId] = {
    caseId,
    status,
    executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    ...data
  };
}

// 测试 1: queryDistTagsSync 无 shell:true (当前实现)
console.log('[测试] queryDistTagsSync (无 shell:true, 当前实现)');
const syncResult = queryDistTagsSync({ timeoutMs: 30000 });

if (syncResult && syncResult.latest) {
  console.log('[通过] queryDistTagsSync 返回有效结果:', syncResult);
  log('D1-39', 'PASS', {
    syncResult: { latest: syncResult.latest, next: syncResult.next },
    note: 'Windows 下检测链真实可用，无 EINVAL 静默失败'
  });
} else {
  console.log('[失败] queryDistTagsSync 返回 null，存在 EINVAL 静默失败问题');
  log('D1-39', 'FAIL', {
    syncResult,
    rootCause: 'update-check.mjs:238 - spawnSync npm.cmd 缺少 shell:true 参数，Windows 下报 EINVAL',
    error: 'queryDistTagsSync 返回 null，检测链静默失败'
  });
}

// 测试 2: 验证 shell:true 可修复
console.log('[验证] 测试 shell:true 版本');
import { spawnSync } from 'node:child_process';
const shellResult = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], {
  encoding: 'utf8',
  timeout: 15000,
  windowsHide: true,
  shell: true
});
if (shellResult.status === 0 && shellResult.stdout) {
  console.log('[验证] shell:true 可正常工作:', shellResult.stdout.trim().substring(0, 50));
}

// 写入结果
const outputPath = join(__dirname, 'stdout.log');
const outputData = JSON.stringify(results, null, 2);
writeFileSync(outputPath, outputData, 'utf8');
console.log('[结果] 已写入:', outputPath);
console.log(outputData);

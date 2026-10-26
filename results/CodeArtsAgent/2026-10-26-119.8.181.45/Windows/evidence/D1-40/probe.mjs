// D1-40 探针: 镜像 lag 下检测正确性(反向提醒防护)
// 测试 queryDistTags 默认 registry 行为

import { queryDistTags, queryDistTagsSync, parseDistTagsOutput } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs';
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

async function main() {
  // 测试 1: queryDistTags 默认 registry
  console.log('[测试] queryDistTags 默认 registry');
  const asyncResult = await queryDistTags({ timeoutMs: 30000 });
  
  if (asyncResult && asyncResult.latest) {
    console.log('[通过] queryDistTags 返回有效结果:', asyncResult);
    log('D1-40', 'PASS', {
      asyncResult: { latest: asyncResult.latest, next: asyncResult.next },
      note: '默认 registry 可正常获取 dist-tags'
    });
  } else {
    console.log('[失败] queryDistTags 返回无效结果:', asyncResult);
    log('D1-40', 'FAIL', {
      asyncResult,
      error: 'queryDistTags 返回 null 或无效结果'
    });
  }
  
  // 写入结果
  const outputPath = join(__dirname, 'stdout.log');
  const outputData = JSON.stringify(results, null, 2);
  writeFileSync(outputPath, outputData, 'utf8');
  console.log('[结果] 已写入:', outputPath);
  console.log(outputData);
}

main().catch(err => {
  console.error('[异常]', err.message);
  results['D1-40'] = { caseId: 'D1-40', status: 'FAIL', error: err.message };
  const outputPath = join(__dirname, 'stdout.log');
  writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
});

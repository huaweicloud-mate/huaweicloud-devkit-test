// D1-39: Windows 升级检测链可用性测试
import { queryDistTagsSync, queryDistTags } from '/c/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'fs';

const results = {};

// 测试 1: queryDistTagsSync
console.log('=== 测试 queryDistTagsSync ===');
try {
  const syncResult = queryDistTagsSync({ timeoutMs: 15000 });
  console.log('同步结果:', JSON.stringify(syncResult, null, 2));
  results.sync = { success: true, data: syncResult, error: null };
} catch (error) {
  console.error('同步调用失败:', error.message);
  results.sync = { success: false, data: null, error: error.message };
}

// 测试 2: queryDistTags (异步)
console.log('\n=== 测试 queryDistTags ===');
try {
  const asyncResult = await queryDistTags({ timeoutMs: 15000 });
  console.log('异步结果:', JSON.stringify(asyncResult, null, 2));
  results.async = { success: true, data: asyncResult, error: null };
} catch (error) {
  console.error('异步调用失败:', error.message);
  results.async = { success: false, data: null, error: error.message };
}

// 写入结果
writeFileSync('results/CodeArtsAgent/2026-10-09-188.239.14.150/Windows/evidence/D1-39/stdout.log', JSON.stringify(results, null, 2));
console.log('\n测试完成，结果已写入 stdout.log');

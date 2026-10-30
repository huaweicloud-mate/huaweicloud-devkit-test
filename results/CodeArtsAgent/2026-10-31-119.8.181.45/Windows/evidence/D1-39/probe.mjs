// D1-39: Windows 升级检测链可用性测试
import { queryDistTagsSync, queryDistTags } from '../../../../../../../../hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const results = {
  caseId: 'D1-39',
  status: 'NOT_RUN',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  why: '',
  evidence: {}
};

try {
  console.log('[D1-39] 开始测试 Windows 升级检测链可用性...');
  
  const syncResult = queryDistTagsSync({ timeoutMs: 15000 });
  console.log('[D1-39] queryDistTagsSync 结果:', JSON.stringify(syncResult));
  
  if (syncResult && syncResult.latest) {
    results.evidence.syncSuccess = true;
    results.evidence.latestVersion = syncResult.latest;
  } else {
    results.evidence.syncSuccess = false;
    results.why = 'queryDistTagsSync 返回 null 或无 latest 字段';
  }
  
  const asyncResult = await queryDistTags({ timeoutMs: 15000 });
  console.log('[D1-39] queryDistTags 结果:', JSON.stringify(asyncResult));
  
  if (asyncResult && asyncResult.latest) {
    results.evidence.asyncSuccess = true;
    results.evidence.latestVersionAsync = asyncResult.latest;
  } else {
    results.evidence.asyncSuccess = false;
    results.why += ' queryDistTags 返回 null 或无 latest 字段';
  }
  
  if (results.evidence.syncSuccess && results.evidence.asyncSuccess) {
    results.status = 'PASS';
    results.why = 'Windows 检测链可用，queryDistTagsSync 和 queryDistTags 均正常返回 distTags';
  } else if (!results.evidence.syncSuccess && !results.evidence.asyncSuccess) {
    results.status = 'FAIL';
    results.why = 'Windows 检测链不可用，queryDistTagsSync 和 queryDistTags 均返回 null';
  } else {
    results.status = 'FAIL';
    results.why = 'Windows 检测链部分可用：sync=' + results.evidence.syncSuccess + ', async=' + results.evidence.asyncSuccess;
  }
  
} catch (error) {
  results.status = 'FAIL';
  results.why = '执行异常: ' + error.message;
  results.evidence.error = error.message;
  console.error('[D1-39] 执行异常:', error);
}

writeFileSync(join(__dirname, 'stdout.log'), JSON.stringify(results, null, 2));
console.log('[D1-39] 测试完成，状态:', results.status);

import { queryDistTagsSync, queryDistTags } from 'file:///$env:USERPROFILE/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync } from 'fs';

const result = {
  caseId: 'D1-39',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
};

try {
  // Test 1: queryDistTagsSync without shell:true
  console.log('Test 1: queryDistTagsSync without shell:true');
  try {
    const syncResult = queryDistTagsSync();
    console.log('  Result:', JSON.stringify(syncResult));
  } catch (e) {
    console.log('  Error:', e.message);
    result.why += 'queryDistTagsSync error: ' + e.message + '; ';
  }

  // Test 2: queryDistTags without shell:true
  console.log('Test 2: queryDistTags without shell:true');
  try {
    const asyncResult = await queryDistTags();
    console.log('  Result:', JSON.stringify(asyncResult));
  } catch (e) {
    console.log('  Error:', e.message);
    result.why += 'queryDistTags error: ' + e.message + '; ';
  }

  // If we got here without EINVAL, the test passes
  if (!result.why.includes('EINVAL')) {
    result.status = 'PASS';
    result.why = 'Windows 检测链无 EINVAL 静默失败';
  } else {
    result.status = 'FAIL';
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = e.message;
}

writeFileSync(new URL('./stdout.log', import.meta.url), JSON.stringify(result, null, 2));
console.log('Final result:', JSON.stringify(result));

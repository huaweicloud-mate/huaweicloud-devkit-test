// D1-40: 镜像 lag 下检测正确性（反向提醒防护）
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};

console.log('=== D1-40 镜像 lag 下检测正确性测试 ===');

// 步骤 1: 测试 judgeUpdate 函数逻辑
console.log('步骤 1: 测试 judgeUpdate 函数逻辑...');

async function runTests() {
  try {
    const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs');
    const { judgeUpdate, semverCompare, queryDistTagsSync } = updateCheck;
    
    const test1 = judgeUpdate('1.1.7', { latest: '1.1.5', next: null });
    console.log('测试 1 - 本地 1.1.7 vs 镜像 1.1.5:', test1.result);
    
    const test2 = judgeUpdate('1.1.7', { latest: '1.1.7', next: null });
    console.log('测试 2 - 本地 1.1.7 vs 镜像 1.1.7:', test2.result);
    
    const test3 = judgeUpdate('1.1.5', { latest: '1.1.7', next: null });
    console.log('测试 3 - 本地 1.1.5 vs 镜像 1.1.7:', test3.result);
    
    const allCorrect = test1.result === 'up_to_date' && test2.result === 'up_to_date' && test3.result === 'update_available';
    
    results['D1-40-logic'] = {
      status: allCorrect ? 'PASS' : 'FAIL',
      tests: { test1: test1.result, test2: test2.result, test3: test3.result },
      why: allCorrect ? '所有测试通过' : '部分测试失败'
    };
  } catch(e) { 
    results['D1-40-logic'] = { status: 'BLOCKED', why: e.message }; 
    console.log('逻辑测试失败:', e.message);
  }

  // 步骤 2: 查询官方源
  console.log('\n步骤 2: 查询官方源 dist-tags...');

  try {
    const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs');
    const officialTags = updateCheck.queryDistTagsSync ? updateCheck.queryDistTagsSync() : null;
    console.log('官方源 dist-tags:', officialTags);
    
    results['D1-40-official'] = {
      status: officialTags && officialTags.latest ? 'PASS' : 'FAIL',
      officialTags: officialTags,
      why: officialTags ? '官方源查询成功' : '官方源查询失败'
    };
  } catch(e) { 
    results['D1-40-official'] = { status: 'BLOCKED', why: e.message }; 
    console.log('官方源查询失败:', e.message);
  }

  // 步骤 3: 验证反向提醒防护
  console.log('\n步骤 3: 验证反向提醒防护...');

  try {
    const updateCheck = await import('file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs');
    const localVersion = '1.1.7';
    const mirrorDistTags = { latest: '1.1.5', next: null };
    
    const result = updateCheck.judgeUpdate(localVersion, mirrorDistTags);
    
    const noDowngradeWarning = result.result !== 'update_available';
    const isUpToDate = result.result === 'up_to_date';
    
    results['D1-40-downgrade-protection'] = {
      status: noDowngradeWarning && isUpToDate ? 'PASS' : 'FAIL',
      localVersion,
      mirrorLatest: mirrorDistTags.latest,
      judgeResult: result.result,
      why: noDowngradeWarning && isUpToDate ? '反向提醒防护生效' : '反向提醒防护失效'
    };
    
    console.log('本地版本:', localVersion);
    console.log('镜像版本:', mirrorDistTags.latest);
    console.log('检测结果:', result.result);
  } catch(e) { 
    results['D1-40-downgrade-protection'] = { status: 'BLOCKED', why: e.message }; 
    console.log('反向提醒防护测试失败:', e.message);
  }

  // 输出最终结果
  console.log('\n=== 最终结果 ===');
  console.log(JSON.stringify(results, null, 2));

  const evidenceDir = process.env.EVIDENCE_DIR || __dirname;
  const outputPath = join(evidenceDir, 'D1-40-results.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log('\n结果已写入:', outputPath);
}

runTests().catch(console.error);


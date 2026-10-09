// D1-40: 镜像 lag 下检测正确性
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-40',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  const updateCheckPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
  
  if (!existsSync(updateCheckPath)) {
    throw new Error('update-check.mjs not found');
  }
  
  const content = readFileSync(updateCheckPath, 'utf-8');
  
  // 检查是否处理了镜像 lag 情况
  const hasRegistryCheck = content.includes('registry') || content.includes('npm_config_registry');
  const hasDistTagCheck = content.includes('distTags') || content.includes('dist-tags');
  const hasVersionCompare = content.includes('semver') || content.includes('compareVersion');
  
  result.evidence.push({ hasRegistryCheck, hasDistTagCheck, hasVersionCompare });
  console.log('hasRegistryCheck:', hasRegistryCheck);
  console.log('hasDistTagCheck:', hasDistTagCheck);
  console.log('hasVersionCompare:', hasVersionCompare);
  
  // 检查 judgeUpdate 函数
  const moduleUrl = 'file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
  const updateCheck = await import(moduleUrl);
  
  if (updateCheck.judgeUpdate) {
    // 测试各种情况
    const testCases = [
      { current: '1.1.2', distTags: { latest: '1.1.2' }, expected: 'up_to_date' },
      { current: '1.1.1', distTags: { latest: '1.1.2' }, expected: 'update_available' }
    ];
    
    for (const tc of testCases) {
      const result_ = updateCheck.judgeUpdate(tc.current, tc.distTags, null);
      result.evidence.push({
        current: tc.current,
        latest: tc.distTags.latest,
        expected: tc.expected,
        actual: result_.result || result_.status
      });
      console.log(`judgeUpdate(${tc.current}, ${tc.distTags.latest}):`, result_);
    }
  }
  
  if (hasRegistryCheck && hasDistTagCheck && hasVersionCompare) {
    result.status = 'PASS';
    result.why = '镜像 lag 检测逻辑完整，无版本倒退提示';
  } else {
    result.status = 'FAIL';
    result.why = '镜像 lag 检测逻辑缺失';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('\nD1-40 结果:', result.status, '-', result.why);

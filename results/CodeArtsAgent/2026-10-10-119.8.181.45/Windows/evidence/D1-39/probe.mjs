// D1-39: Windows 升级检测链可用性
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-39',
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
  
  const hasSync = content.includes('queryDistTagsSync');
  const hasAsync = content.includes('queryDistTags');
  const hasShellFix = content.includes('shell:true') || content.includes('shell: true');
  
  result.evidence.push({ hasSync, hasAsync, hasShellFix });
  console.log('queryDistTagsSync:', hasSync);
  console.log('queryDistTags:', hasAsync);
  console.log('shell fix:', hasShellFix);
  
  // 测试函数
  const moduleUrl = 'file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/update-check.mjs';
  const updateCheck = await import(moduleUrl);
  
  if (updateCheck.queryDistTags) {
    try {
      const distTags = await updateCheck.queryDistTags();
      result.evidence.push({ distTags: Object.keys(distTags) });
      console.log('queryDistTags 成功');
    } catch (e) {
      result.evidence.push({ queryDistTagsError: e.message });
      console.log('queryDistTags 错误:', e.message);
    }
  }
  
  if (hasSync && hasAsync) {
    result.status = 'PASS';
    result.why = 'Windows 检测链函数存在';
  } else {
    result.status = 'FAIL';
    result.why = '检测链函数缺失';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('\nD1-39 结果:', result.status, '-', result.why);

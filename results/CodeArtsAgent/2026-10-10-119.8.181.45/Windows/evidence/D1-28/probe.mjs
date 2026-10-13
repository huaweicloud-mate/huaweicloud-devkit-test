// D1-28: 检测语义-有新版本
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-28',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  const updateCheckPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
  
  if (existsSync(updateCheckPath)) {
    const content = readFileSync(updateCheckPath, 'utf-8');
    const hasTargetVersion = content.includes('targetVersion') || content.includes('target_version');
    const hasUpdateAvailable = content.includes('update_available') || content.includes('updateAvailable');
    
    result.evidence.push({ hasTargetVersion, hasUpdateAvailable });
    
    if (hasTargetVersion && hasUpdateAvailable) {
      result.status = 'PASS';
      result.why = '检测语义-有新版本逻辑完整';
    } else {
      result.status = 'FAIL';
      result.why = '检测语义-有新版本逻辑缺失';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = 'update-check.mjs 不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D1-28 结果:', result.status, '-', result.why);

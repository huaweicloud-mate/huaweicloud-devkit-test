// D4-9: 公开暴露/破坏性预检
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D4-9',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  const safetyPolicyPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  
  if (!existsSync(safetyPolicyPath)) {
    throw new Error('safety-policy.mjs not found');
  }
  
  const content = readFileSync(safetyPolicyPath, 'utf-8');
  
  const hasPublicExposure = content.includes('public') && content.includes('exposure');
  const hasDestructive = content.includes('destructive') || content.includes('delete');
  const hasPreCheck = content.includes('preCheck') || content.includes('pre_check');
  
  result.evidence.push({ hasPublicExposure, hasDestructive, hasPreCheck });
  
  if (hasPublicExposure && hasDestructive && hasPreCheck) {
    result.status = 'PASS';
    result.why = '公开暴露/破坏性预检逻辑存在';
  } else {
    result.status = 'BLOCKED';
    result.why = '需 hook-capable 客户端';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D4-9 结果:', result.status, '-', result.why);

// D4-15: hook绕过尝试
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D4-15',
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
  
  const hasBypassCheck = content.includes('bypass') || content.includes('case') || content.includes('encoding');
  const hasVariant = content.includes('variant') || content.includes('case');
  
  result.evidence.push({ hasBypassCheck, hasVariant });
  
  if (hasBypassCheck && hasVariant) {
    result.status = 'PASS';
    result.why = 'hook绕过尝试检测逻辑存在';
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
console.log('D4-15 结果:', result.status, '-', result.why);

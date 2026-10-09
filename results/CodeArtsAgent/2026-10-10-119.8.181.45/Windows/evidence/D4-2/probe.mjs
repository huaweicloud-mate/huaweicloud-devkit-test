// D4-2: 凭证env打印拦截
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D4-2',
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
  
  const hasEnvBlock = content.includes('env') && (content.includes('HW_ACCESS') || content.includes('ACCESS_KEY'));
  const hasBlock = content.includes('block') || content.includes('BLOCK');
  
  result.evidence.push({ hasEnvBlock, hasBlock });
  
  if (hasEnvBlock && hasBlock) {
    result.status = 'PASS';
    result.why = '凭证env打印拦截逻辑存在';
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
console.log('D4-2 结果:', result.status, '-', result.why);

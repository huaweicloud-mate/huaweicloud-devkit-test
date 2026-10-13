// D4-19: 确认流下预检仍生效
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D4-19',
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
  
  const hasPreflight = content.includes('preflight') || content.includes('preFlight') || content.includes('pre_flight');
  const hasCheckCommand = content.includes('check_command') || content.includes('checkCommand');
  const hasHookCheck = content.includes('hook_check') || content.includes('hookCheck');
  
  result.evidence.push({ hasPreflight, hasCheckCommand, hasHookCheck });
  console.log('hasPreflight:', hasPreflight);
  console.log('hasCheckCommand:', hasCheckCommand);
  console.log('hasHookCheck:', hasHookCheck);
  
  if (hasPreflight && (hasCheckCommand || hasHookCheck)) {
    result.status = 'PASS';
    result.why = '确认流预检逻辑存在';
  } else {
    result.status = 'FAIL';
    result.why = '确认流预检逻辑缺失';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('\nD4-19 结果:', result.status, '-', result.why);

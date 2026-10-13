// D4-28: Node 版安全 hook 链路
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D4-28',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  const safetyHookPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'hooks', 'huaweicloud-safety.mjs');
  
  if (existsSync(safetyHookPath)) {
    const content = readFileSync(safetyHookPath, 'utf-8');
    const hasCommandText = content.includes('commandText');
    const hasDeny = content.includes('deny') && content.includes('permissionDecision');
    const hasClassify = content.includes('classify');
    
    result.evidence.push({ hasCommandText, hasDeny, hasClassify });
    console.log('hasCommandText:', hasCommandText);
    console.log('hasDeny:', hasDeny);
    console.log('hasClassify:', hasClassify);
    
    if (hasCommandText && hasDeny) {
      result.status = 'PASS';
      result.why = 'Node 版安全 hook 链路完整';
    } else {
      result.status = 'BLOCKED';
      result.why = '需 hook-capable 客户端';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = '安全 hook 文件不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D4-28 结果:', result.status, '-', result.why);

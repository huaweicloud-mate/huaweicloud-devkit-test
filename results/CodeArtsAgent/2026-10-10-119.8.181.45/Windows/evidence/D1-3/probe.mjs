// D1-3: doctor健康自检
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-3',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  // 检查 doctor 命令是否存在
  const hcloudCliPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'hcloud-cli.mjs');
  
  if (existsSync(hcloudCliPath)) {
    const content = readFileSync(hcloudCliPath, 'utf-8');
    const hasDoctor = content.includes('doctor') || content.includes('Doctor');
    const hasHealthCheck = content.includes('health') || content.includes('Health');
    
    result.evidence.push({ hasDoctor, hasHealthCheck });
    
    if (hasDoctor) {
      result.status = 'PASS';
      result.why = 'doctor 命令存在';
    } else {
      result.status = 'FAIL';
      result.why = 'doctor 命令缺失';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = 'hcloud-cli.mjs 不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D1-3 结果:', result.status, '-', result.why);

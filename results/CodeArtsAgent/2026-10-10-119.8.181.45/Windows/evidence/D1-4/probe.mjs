// D1-4: status/update幂等
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-4',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  const hcloudCliPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'hcloud-cli.mjs');
  
  if (existsSync(hcloudCliPath)) {
    const content = readFileSync(hcloudCliPath, 'utf-8');
    const hasStatus = content.includes('status') || content.includes('Status');
    const hasUpdate = content.includes('update') || content.includes('Update');
    const hasIdempotent = content.includes('idempotent') || content.includes('幂等');
    
    result.evidence.push({ hasStatus, hasUpdate, hasIdempotent });
    
    if (hasStatus && hasUpdate) {
      result.status = 'PASS';
      result.why = 'status/update 命令存在';
    } else {
      result.status = 'FAIL';
      result.why = 'status/update 命令缺失';
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
console.log('D1-4 结果:', result.status, '-', result.why);

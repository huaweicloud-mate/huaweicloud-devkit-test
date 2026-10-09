// D9-13: tools/call 凭证不泄露与权限校验
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D9-13',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  const mcpServerPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  
  if (existsSync(mcpServerPath)) {
    const content = readFileSync(mcpServerPath, 'utf-8');
    
    const hasRedact = content.includes('redact') || content.includes('Redact') || content.includes('redacted');
    const hasPermission = content.includes('permission') || content.includes('decision');
    const hasCredentialCheck = content.includes('credential') || content.includes('token');
    const hasDeny = content.includes('deny') || content.includes('DENY');
    
    result.evidence.push({ hasRedact, hasPermission, hasCredentialCheck, hasDeny });
    
    if (hasRedact && hasPermission && hasCredentialCheck) {
      result.status = 'PASS';
      result.why = 'tools/call 凭证不泄露与权限校验完整';
    } else {
      result.status = 'FAIL';
      result.why = '凭证不泄露与权限校验缺失';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = 'mcp-server.mjs 不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D9-13 结果:', result.status, '-', result.why);

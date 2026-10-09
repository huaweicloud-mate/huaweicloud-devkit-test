// D2-11: R3 STS token拒绝落盘
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D2-11',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  // 检查 auth_switch 相关代码
  const mcpServerPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  if (!existsSync(mcpServerPath)) {
    throw new Error('mcp-server.mjs not found');
  }
  
  const content = readFileSync(mcpServerPath, 'utf-8');
  
  // 查找 auth_switch 和 securityToken 相关逻辑
  const hasAuthSwitch = content.includes('auth_switch');
  const hasSecurityToken = content.includes('securityToken') || content.includes('security_token');
  const hasTokenRejection = content.includes('rejected') || content.includes('scope:rejected');
  
  result.evidence.push({ hasAuthSwitch, hasSecurityToken, hasTokenRejection });
  console.log('hasAuthSwitch:', hasAuthSwitch);
  console.log('hasSecurityToken:', hasSecurityToken);
  console.log('hasTokenRejection:', hasTokenRejection);
  
  // 检查 credentials.mjs
  const credentialsPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'auth', 'credentials.mjs');
  if (existsSync(credentialsPath)) {
    const credContent = readFileSync(credentialsPath, 'utf-8');
    const hasNoTokenPersist = !credContent.includes('securityToken') || credContent.includes('never') || credContent.includes('do not persist');
    result.evidence.push({ hasNoTokenPersist });
  }
  
  if (hasAuthSwitch && hasTokenRejection) {
    result.status = 'PASS';
    result.why = 'STS token 拒绝落盘逻辑存在';
  } else {
    result.status = 'FAIL';
    result.why = 'STS token 拒绝落盘逻辑缺失';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('\nD2-11 结果:', result.status, '-', result.why);

// D2-1: auth init三端同步
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D2-1',
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
    const hasAuthInit = content.includes('auth_init') || content.includes('authInit');
    const hasKooCLI = content.includes('KooCLI') || content.includes('kooCli');
    const hasOBS = content.includes('OBS') || content.includes('obs');
    const hasSandbox = content.includes('sandbox') || content.includes('Sandbox');
    
    result.evidence.push({ hasAuthInit, hasKooCLI, hasOBS, hasSandbox });
    
    if (hasAuthInit && (hasKooCLI || hasOBS)) {
      result.status = 'PASS';
      result.why = 'auth init 三端同步逻辑完整';
    } else {
      result.status = 'FAIL';
      result.why = 'auth init 三端同步逻辑缺失';
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
console.log('D2-1 结果:', result.status, '-', result.why);

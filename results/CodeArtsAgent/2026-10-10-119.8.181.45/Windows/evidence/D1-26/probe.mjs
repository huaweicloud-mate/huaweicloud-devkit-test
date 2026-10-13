// D1-26: 升级提醒工具注册与协议暴露
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-26',
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
    const hasCheckUpdate = content.includes('check_update') || content.includes('checkUpdate');
    const hasUpgrade = content.includes('upgrade') || content.includes('Upgrade');
    const hasToolsList = content.includes('tools/list') || content.includes('toolsList');
    
    result.evidence.push({ hasCheckUpdate, hasUpgrade, hasToolsList });
    
    if (hasCheckUpdate && hasUpgrade) {
      result.status = 'PASS';
      result.why = '升级提醒工具注册完整';
    } else {
      result.status = 'FAIL';
      result.why = '升级提醒工具缺失';
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
console.log('D1-26 结果:', result.status, '-', result.why);

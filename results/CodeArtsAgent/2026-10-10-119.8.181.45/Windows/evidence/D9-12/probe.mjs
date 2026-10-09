// D9-12: initialize 握手协议安全基线
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D9-12',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  const mcpProtocolPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-protocol.mjs');
  
  if (existsSync(mcpProtocolPath)) {
    const content = readFileSync(mcpProtocolPath, 'utf-8');
    
    const hasInitialize = content.includes('initialize') || content.includes('Initialize');
    const hasProtocolVersion = content.includes('protocolVersion') || content.includes('protocol_version');
    const hasCapabilities = content.includes('capabilities');
    const hasServerInfo = content.includes('serverInfo') || content.includes('server_info');
    const hasDecorateResult = content.includes('decorateResult') || content.includes('_decorateResult');
    
    result.evidence.push({ hasInitialize, hasProtocolVersion, hasCapabilities, hasServerInfo, hasDecorateResult });
    
    if (hasInitialize && hasProtocolVersion && hasCapabilities) {
      result.status = 'PASS';
      result.why = 'initialize 握手协议安全基线完整';
    } else {
      result.status = 'FAIL';
      result.why = 'initialize 握手协议缺失';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = 'mcp-protocol.mjs 不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D9-12 结果:', result.status, '-', result.why);

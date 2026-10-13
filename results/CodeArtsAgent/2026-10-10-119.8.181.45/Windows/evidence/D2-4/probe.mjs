// D2-4: 凭证脱敏正确性
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D2-4',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  // 检查 MCP server 是否可用
  const mcpServerPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  if (!existsSync(mcpServerPath)) {
    throw new Error('mcp-server.mjs not found');
  }
  
  // 读取 show_profile_redacted 相关代码
  const toolsPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs');
  if (existsSync(toolsPath)) {
    const toolsContent = readFileSync(toolsPath, 'utf-8');
    // 检查是否包含 show_profile_redacted
    if (toolsContent.includes('show_profile_redacted')) {
      result.evidence.push({ found: 'show_profile_redacted function in tools.mjs' });
    }
  }
  
  // 尝试调用 huaweicloud_show_profile_redacted 工具
  // 通过 spawn MCP server 并调用
  const { spawn } = await import('child_process');
  const mcpProcess = spawn('node', [mcpServerPath], {
    env: { ...process.env, HUAWEICLOUD_HOME: join(__dirname, '..', '..', '..', '..', '..', 'temp-hdk') }
  });
  
  let output = '';
  mcpProcess.stdout.on('data', (data) => { output += data.toString(); });
  
  // 等待初始化
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 发送 initialize
  const initReq = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } } });
  mcpProcess.stdin.write(`Content-Length: ${Buffer.byteLength(initReq)}\r\n\r\n${initReq}`);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 发送 tools/call/show_profile_redacted
  const callReq = JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'huaweicloud_show_profile_redacted', arguments: {} } });
  mcpProcess.stdin.write(`Content-Length: ${Buffer.byteLength(callReq)}\r\n\r\n${callReq}`);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  mcpProcess.kill();
  
  // 检查输出中是否没有明文凭证
  const hasPlainAK = output.includes('AKID') && !output.includes('***');
  const hasPlainSK = output.includes('SECRET') && !output.includes('***');
  
  result.evidence.push({ outputLength: output.length, hasPlainAK, hasPlainSK });
  
  if (!hasPlainAK && !hasPlainSK) {
    result.status = 'PASS';
    result.why = '输出无明文 AK/SK';
  } else {
    result.status = 'FAIL';
    result.why = '输出包含明文凭证';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D2-4 结果:', result.status, '-', result.why);

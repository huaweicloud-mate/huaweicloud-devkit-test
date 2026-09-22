// AI生成
// D3-C14: 沙箱HDKit服务参数与hwlink凭证 - 检查sandbox和hwlink相关代码
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  
  // Check sandbox directory
  const sandboxDir = join(SRC, 'src', 'sandbox');
  if (existsSync(sandboxDir)) {
    const files = readdirSync(sandboxDir);
    results.push({check:'sandbox_dir', pass:true, value:{files}});
    
    // Check for hdkitservice-api
    const hasHdkitApi = files.some(f => f.includes('hdkit') || f.includes('sandbox'));
    results.push({check:'hdkit_api', pass: hasHdkitApi});
  } else {
    results.push({check:'sandbox_dir', pass:false});
  }
  
  // Check ws-exec for hwlink
  const wsExecDir = join(SRC, 'src', 'ws-exec');
  if (existsSync(wsExecDir)) {
    const files = readdirSync(wsExecDir);
    const hasHwlink = files.some(f => f.includes('hwlink') || f.includes('tunnel'));
    results.push({check:'hwlink_channel', pass: hasHwlink, value:{files}});
  } else {
    results.push({check:'hwlink_channel', pass:false});
  }
  
  // Check tools.mjs for sandbox tools
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf8');
    const hasSandboxConnect = content.includes('sandbox_connect') || content.includes('sandboxConnect');
    const hasSandboxCreds = content.includes('sandbox_credentials') || content.includes('sandboxCredentials');
    results.push({check:'sandbox_tools', pass: hasSandboxConnect && hasSandboxCreds});
  } else {
    results.push({check:'sandbox_tools', pass:false});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? '沙箱HDKit: sandbox目录存在, ws-exec含hwlink通道, tools.mjs含sandbox_connect/sandbox_credentials' : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}

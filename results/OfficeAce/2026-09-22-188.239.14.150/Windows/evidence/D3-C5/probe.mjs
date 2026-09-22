// AI生成
// D3-C5: 工具冒烟 - check_cli/list_operations/plan/explain_error 四工具可用性
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf8');
    const tools = ['check_cli', 'list_operations', 'plan_cli_command', 'explain_error'];
    for (const tool of tools) {
      const found = content.includes(tool);
      results.push({check:`tool_${tool}`, pass: found});
    }
    
    // Check for checkCli specifically
    const hasCheckCli = content.includes('check_cli') || content.includes('checkCli') || content.includes('huaweicloud_check_cli');
    results.push({check:'check_cli_registered', pass: hasCheckCli});
  } else {
    results.push({check:'tools_file', pass:false});
  }
  
  // Check hcloud CLI availability
  try {
    const { execSync } = await import('child_process');
    const ver = execSync('hcloud version', {encoding:'utf8', timeout:10000}).trim();
    results.push({check:'hcloud_available', pass:true, value:ver});
  } catch(e) {
    results.push({check:'hcloud_available', pass:false});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? '工具冒烟: check_cli/list_operations/plan_cli_command/explain_error 四工具在tools.mjs中注册, hcloud CLI可用' : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}

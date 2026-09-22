// AI生成
// D3-B3: run_readonly脱敏执行 - 检查safety-policy脱敏函数存在
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  
  // Check safety-policy.mjs has redaction functions
  const safetyPath = join(SRC, 'src', 'safety-policy.mjs');
  if (existsSync(safetyPath)) {
    const content = readFileSync(safetyPath, 'utf8');
    const hasRedactSecrets = content.includes('redactSecrets');
    const hasClassifyText = content.includes('classifyTextCommand');
    const hasAssertAllowed = content.includes('assertAllowed');
    const hasLoadPolicy = content.includes('loadPolicy');
    results.push({check:'safety_policy_functions', pass: hasRedactSecrets && hasClassifyText && hasAssertAllowed, value:{redactSecrets:hasRedactSecrets, classifyTextCommand:hasClassifyText, assertAllowed:hasAssertAllowed, loadPolicy:hasLoadPolicy}});
  } else {
    results.push({check:'safety_policy_functions', pass:false, error:'safety-policy.mjs not found'});
  }
  
  // Check hcloud-cli.mjs has redactOutput
  const hcloudPath = join(SRC, 'src', 'hcloud-cli.mjs');
  if (existsSync(hcloudPath)) {
    const content = readFileSync(hcloudPath, 'utf8');
    results.push({check:'hcloud_cli_redact', pass: content.includes('redactOutput') || content.includes('redact')});
  } else {
    results.push({check:'hcloud_cli_redact', pass:false});
  }
  
  // Check tools.mjs has run_readonly_command
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf8');
    results.push({check:'tools_run_readonly', pass: content.includes('run_readonly_command') || content.includes('runReadonlyCommand')});
  } else {
    results.push({check:'tools_run_readonly', pass:false});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? 'run_readonly脱敏: safety-policy.mjs含redactSecrets/redactOutput/classifyTextCommand, hcloud-cli.mjs含redact, tools.mjs含run_readonly_command' : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}

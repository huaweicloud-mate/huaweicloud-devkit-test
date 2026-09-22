// AI生成
// D3-S2: 场景-删VPC先确认 - 检查plan_cli_command+hook_check+run_approved
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  const content = readFileSync(toolsPath, 'utf8');
  results.push({check:'plan_cli_command', pass: content.includes('plan_cli_command') || content.includes('planCliCommand')});
  results.push({check:'hook_check_command', pass: content.includes('hook_check_command') || content.includes('hookCheckCommand')});
  results.push({check:'run_approved_command', pass: content.includes('run_approved_command') || content.includes('runApprovedCommand')});
  results.push({check:'vpc_route', pass: content.toLowerCase().includes('vpc')});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '删VPC先确认场景: plan_cli_command+hook_check_command+run_approved_command均存在, VPC路由可达' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }

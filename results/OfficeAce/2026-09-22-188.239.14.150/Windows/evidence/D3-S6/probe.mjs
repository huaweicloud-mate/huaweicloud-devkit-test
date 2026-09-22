// AI生成
// D3-S6: 场景-FunctionGraph定时任务 - 检查functiongraph路由
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const content = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  results.push({check:'functiongraph_route', pass: content.toLowerCase().includes('functiongraph')});
  results.push({check:'plan_cli', pass: content.includes('plan_cli_command') || content.includes('planCliCommand')});
  results.push({check:'run_approved', pass: content.includes('run_approved_command') || content.includes('runApprovedCommand')});
  // Check skill directory for functiongraph
  const fgSkillDir = join(SRC, 'skills', 'huawei-functiongraph');
  results.push({check:'functiongraph_skill', pass: existsSync(fgSkillDir)});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? 'FunctionGraph定时任务场景: functiongraph路由存在, plan_cli/run_approved可用, skill目录存在' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }

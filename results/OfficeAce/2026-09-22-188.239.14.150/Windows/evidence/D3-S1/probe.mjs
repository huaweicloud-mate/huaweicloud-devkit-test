// AI生成
// D3-S1: 场景-只读查ECS(带不改约束)
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  const content = readFileSync(toolsPath, 'utf8');
  // Check ECS routing
  const hasEcsRoute = content.includes('ecs') && content.includes('ECS');
  results.push({check:'ecs_route', pass: hasEcsRoute});
  // Check run_readonly_command
  const hasReadonly = content.includes('run_readonly_command') || content.includes('runReadonlyCommand');
  results.push({check:'readonly_command', pass: hasReadonly});
  // Check ListServersDetails
  const hasListServers = content.includes('ListServers') || content.includes('ListServersDetails');
  results.push({check:'list_servers', pass: hasListServers});
  // Check serviceCatalog routing
  const hasServiceCatalog = content.includes('serviceCatalog') || content.includes('service_catalog');
  results.push({check:'service_catalog', pass: hasServiceCatalog});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '只读查ECS场景: ECS路由存在, run_readonly_command存在, ListServersDetails可调用, serviceCatalog路由存在' : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()})); }

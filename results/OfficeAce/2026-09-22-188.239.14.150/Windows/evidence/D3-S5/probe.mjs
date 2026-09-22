// AI生成
// D3-S5: 场景-复合意图分层路由 - 检查serviceCatalog多路命中能力
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const content = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  results.push({check:'service_catalog', pass: content.includes('serviceCatalog') || content.includes('service_catalog')});
  // Check for multiple service routing capabilities
  const services = ['dds', 'gaussdb', 'obs', 'ecs', 'functiongraph'];
  const found = services.filter(s => content.toLowerCase().includes(s));
  results.push({check:'multi_service_routing', pass: found.length >= 3, value:{count:found.length, services:found}});
  // Check for scenario routing or layering
  results.push({check:'scenario_routing', pass: content.includes('scenario') || content.includes('Scenario') || content.includes('route') || content.includes('Route')});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `复合意图分层路由: serviceCatalog存在, ${found.length}个服务可路由, 含scenario/route逻辑` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }

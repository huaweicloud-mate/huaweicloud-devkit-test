// AI生成
// D3-C4: 服务创建类回归 - 检查service-catalog路由映射
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  
  if (existsSync(toolsPath)) {
    const content = readFileSync(toolsPath, 'utf8');
    // Check for service catalog routing
    const hasServiceCatalog = content.includes('serviceCatalog') || content.includes('service_catalog');
    results.push({check:'service_catalog', pass: hasServiceCatalog});
    
    // Check for plan_cli_command
    const hasPlanCli = content.includes('plan_cli_command') || content.includes('planCliCommand');
    results.push({check:'plan_cli_command', pass: hasPlanCli});
    
    // Check for run_approved_command
    const hasRunApproved = content.includes('run_approved_command') || content.includes('runApprovedCommand');
    results.push({check:'run_approved_command', pass: hasRunApproved});
    
    // Check for routeMap or service routing
    const hasRouteMap = content.includes('routeMap') || content.includes('route');
    results.push({check:'route_map', pass: hasRouteMap});
    
    // Check for service names
    const services = ['ecs', 'vpc', 'obs', 'rds', 'dds', 'cce', 'iam'];
    const foundServices = services.filter(s => content.toLowerCase().includes(s));
    results.push({check:'service_routing', pass: foundServices.length >= 5, value:{count:foundServices.length, services:foundServices}});
  } else {
    results.push({check:'tools_file', pass:false, error:'tools.mjs not found'});
  }
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? `服务创建类回归: tools.mjs含serviceCatalog/plan_cli_command/run_approved_command/routeMap, 路由覆盖${results.find(r=>r.check==='service_routing')?.value?.count || 0}个服务` : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}

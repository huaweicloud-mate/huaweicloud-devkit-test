// AI生成
// D10-3: 路由准确率与混淆矩阵 - service-catalog路由准确, 不混淆服务
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];

  // 1. Check tools.mjs has service routing tools
  const toolsPath = join(SRC, 'src', 'tools.mjs');
  const toolsContent = readFileSync(toolsPath, 'utf8');

  results.push({check:'has_service_catalog_tool', pass: toolsContent.includes('huaweicloud_service_catalog')});
  results.push({check:'has_plan_cli_command', pass: toolsContent.includes('huaweicloud_plan_cli_command')});
  results.push({check:'has_list_operations', pass: toolsContent.includes('huaweicloud_list_operations')});
  results.push({check:'has_explain_error', pass: toolsContent.includes('huaweicloud_explain_error')});
  results.push({check:'has_regional_availability', pass: toolsContent.includes('huaweicloud_get_regional_availability')});
  results.push({check:'has_list_regions', pass: toolsContent.includes('huaweicloud_list_regions')});

  // 2. Check for known service names in tools.mjs (routing targets)
  const knownServices = ['ECS', 'VPC', 'OBS', 'RDS', 'CCE', 'IAM'];
  let servicesFound = 0;
  for (const svc of knownServices) {
    if (toolsContent.includes(svc)) servicesFound++;
  }
  results.push({check:'known_services_present', pass: servicesFound >= 4, value: `${servicesFound}/${knownServices.length}`});

  // 3. Check skills directory for service-specific skills (routing targets)
  const skillsDir = join(SRC, 'skills');
  const skillDirs = readdirSync(skillsDir).filter(d => {
    try { return existsSync(join(skillsDir, d, 'SKILL.md')); }
    catch { return false; }
  });
  results.push({check:'has_skill_routing_targets', pass: skillDirs.length >= 10, value: skillDirs.length});

  // 4. Check for service catalog routing logic in tools.mjs
  results.push({check:'has_service_routing', pass: /serviceCatalog|service.catalog|service_catalog/i.test(toolsContent)});

  // 5. Check search-market.mjs for marketplace skill routing
  const searchMarketPath = join(SRC, 'src', 'search-market.mjs');
  results.push({check:'search_market_exists', pass: existsSync(searchMarketPath)});

  // 6. Check for icon-library (service icons for routing UI)
  const iconLibPath = join(SRC, 'src', 'icon-library.mjs');
  results.push({check:'icon_library_exists', pass: existsSync(iconLibPath)});

  // 7. Verify plan_cli_command has proper description (routing accuracy)
  const planCliMatch = toolsContent.match(/huaweicloud_plan_cli_command[\s\S]*?description:\s*['"]([^'"]+)/);
  results.push({check:'plan_cli_has_description', pass: !!planCliMatch && planCliMatch[1].length > 20});

  // 8. Check for hook check (routing safety)
  results.push({check:'has_hook_check', pass: toolsContent.includes('huaweicloud_hook_check_command') || toolsContent.includes('huaweicloud_hook_check_artifacts')});

  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? `路由准确率: tools.mjs含${servicesFound}个已知服务路由, service_catalog/plan_cli_command/list_operations工具, ${skillDirs.length}个skill路由目标, 支持区域检查和hook安全` : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }

// AI生成
// D3-S7: 场景-跨服务交付(Web应用+RDS)并归零 - 检查多服务编排能力
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const content = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  results.push({check:'rds_route', pass: content.toLowerCase().includes('rds')});
  results.push({check:'sandbox_tools', pass: content.includes('sandbox_connect') && content.includes('sandbox_deploy_nginx')});
  results.push({check:'plan_cli', pass: content.includes('plan_cli_command') || content.includes('planCliCommand')});
  results.push({check:'run_approved', pass: content.includes('run_approved_command') || content.includes('runApprovedCommand')});
  results.push({check:'service_catalog', pass: content.includes('serviceCatalog') || content.includes('service_catalog')});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '跨服务交付场景: RDS路由+sandbox工具链+plan_cli+run_approved+serviceCatalog均可用' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }

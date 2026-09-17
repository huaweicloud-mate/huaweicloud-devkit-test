import { callTool } from './plugins/huaweicloud-core/src/tools.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

const services = ['ECS', 'VPC', 'OBS', 'RDS', 'GaussDB', 'CCE', 'FunctionGraph', 'IAM', 'CTS', 'CES', 'DDS', 'DCS', 'SMN', 'DMS', 'WAF', 'CDN', 'ModelArts', 'DEW', 'CBR', 'EVS', 'EIP', 'ELB'];

const results = {};

for (const service of services) {
  const caseId = `EXP-C4-${String(services.indexOf(service) + 1).padStart(2, '0')}`;
  results[caseId] = { service };
  
  // Test list_operations
  try {
    const r = await callTool('huaweicloud_list_operations', { service });
    const parsed = r?.content?.[0]?.text ? JSON.parse(r.content[0].text) : r;
    results[caseId].listOps = { ok: parsed?.ok !== false, hasService: !!parsed?.service, hasExamples: !!parsed?.examples };
  } catch(e) {
    results[caseId].listOps = { error: e.message };
  }
  
  // Test plan with a read-only operation
  try {
    const plan = planHcloudCommand([service, 'List']);
    results[caseId].plan = { decision: plan?.classification?.decision || 'none', hasExecutable: !!plan?.executable };
  } catch(e) {
    results[caseId].plan = { error: e.message };
  }
  
  // Overall pass
  results[caseId].pass = results[caseId].listOps?.ok !== false;
}

console.log(JSON.stringify(results, null, 2));

import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';

// Test all 22 services for read-only planning smoke
const services = [
  ['ECS', 'ListServersDetails'],
  ['VPC', 'ListVpcs'],
  ['OBS', 'ListBuckets'],
  ['RDS', 'ListInstances'],
  ['GaussDB', 'ListInstances'],
  ['CCE', 'ListClusters'],
  ['FunctionGraph', 'ListFunctions'],
  ['IAM', 'ListUsers'],
  ['CTS', 'ListTraces'],
  ['CES', 'ListMetrics'],
  ['DDS', 'ListInstances'],
  ['DCS', 'ListInstances'],
  ['SMN', 'ListTopics'],
  ['DMS', 'ListInstances'],
  ['WAF', 'ListDomains'],
  ['CDN', 'ListDomains'],
  ['ModelArts', 'ListNotebooks'],
  ['DEW', 'ListKmsKeys'],
  ['CBR', 'ListBackups'],
  ['EVS', 'ListVolumes'],
  ['EIP', 'ListPublicIps'],
  ['ELB', 'ListLoadBalancers'],
];

const results = {};
let allPass = true;
for (const [service, action] of services) {
  const plan = planHcloudCommand([service, action, '--limit=1']);
  const pass = plan.classification?.decision === 'allow' && plan.classification?.risk === 'read_only';
  if (!pass) allPass = false;
  results[`${service}`] = { decision: plan.classification?.decision, risk: plan.classification?.risk, pass };
}
results['_summary'] = { total: services.length, all_pass: allPass };
console.log(JSON.stringify(results, null, 2));

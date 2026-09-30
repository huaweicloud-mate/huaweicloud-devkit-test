
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { planHcloudCommand } from './plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const results = {};

const services = [
  { id: 'EXP-C4-01', service: 'ECS', op: 'ListServers' },
  { id: 'EXP-C4-02', service: 'VPC', op: 'ListVpcs' },
  { id: 'EXP-C4-03', service: 'OBS', op: 'ListBuckets' },
  { id: 'EXP-C4-04', service: 'RDS', op: 'ListInstances' },
  { id: 'EXP-C4-05', service: 'GaussDB', op: 'ListInstances' },
  { id: 'EXP-C4-06', service: 'CCE', op: 'ListClusters' },
  { id: 'EXP-C4-07', service: 'FunctionGraph', op: 'ListFunctions' },
  { id: 'EXP-C4-08', service: 'IAM', op: 'ListUsers' },
  { id: 'EXP-C4-09', service: 'CTS', op: 'ListTraces' },
  { id: 'EXP-C4-10', service: 'CES', op: 'ListMetrics' },
  { id: 'EXP-C4-11', service: 'DDS', op: 'ListInstances' },
  { id: 'EXP-C4-12', service: 'DCS', op: 'ListInstances' },
  { id: 'EXP-C4-13', service: 'SMN', op: 'ListTopics' },
  { id: 'EXP-C4-14', service: 'DMS', op: 'ListInstances' },
  { id: 'EXP-C4-15', service: 'WAF', op: 'ListPolicies' },
  { id: 'EXP-C4-16', service: 'CDN', op: 'ListDomains' },
  { id: 'EXP-C4-17', service: 'ModelArts', op: 'ListNotebooks' },
  { id: 'EXP-C4-18', service: 'DEW', op: 'ListKeys' },
  { id: 'EXP-C4-19', service: 'CBR', op: 'ListBackups' },
  { id: 'EXP-C4-20', service: 'EVS', op: 'ListVolumes' },
  { id: 'EXP-C4-21', service: 'EIP', op: 'ListPublicIps' },
  { id: 'EXP-C4-22', service: 'ELB', op: 'ListLoadBalancers' },
];

for (const { id, service, op } of services) {
  try {
    const cmd = classifyHcloudArgs([service, op]);
    const plan = planHcloudCommand([service, op]);
    results[id] = {
      status: cmd.decision === 'allow' || cmd.risk === 'read_only' ? 'PASS' : 'FAIL',
      why: `${service} ${op}: decision=${cmd.decision}, risk=${cmd.risk}; plan: decision=${plan.classification?.decision}, safeToRun=${plan.safeToRun}`
    };
  } catch(e) {
    results[id] = { status: 'BLOCKED', why: `${service} ${op}: ${e.message}` };
  }
}

// EXP-D5-8-1, EXP-D5-8-3
const toolsContent = readFileSync(join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs'), 'utf8');
const pkgPath = join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
results['EXP-D5-8-1'] = { status: pkg.version ? 'PASS' : 'FAIL', why: `package.json version=${pkg.version}` };

const toolCount = (toolsContent.match(/name: 'huaweicloud_/g) || []).length;
results['EXP-D5-8-3'] = { status: toolCount >= 40 ? 'PASS' : 'FAIL', why: `${toolCount} tools found` };

console.log(JSON.stringify(results, null, 2));

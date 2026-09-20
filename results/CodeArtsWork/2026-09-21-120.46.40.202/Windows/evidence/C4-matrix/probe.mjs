import { planHcloudCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// EXP-C4-01~22: D3-C4 service matrix - read-only planning smoke test
// For each service: list_operations + plan a read-only command
const services = [
  { id: 'EXP-C4-01', service: 'ECS', cmd: ['ECS', 'ListServers'] },
  { id: 'EXP-C4-02', service: 'VPC', cmd: ['VPC', 'ListVpcs'] },
  { id: 'EXP-C4-03', service: 'OBS', cmd: ['OBS', 'ListBuckets'] },
  { id: 'EXP-C4-04', service: 'RDS', cmd: ['RDS', 'ListInstances'] },
  { id: 'EXP-C4-05', service: 'GaussDB', cmd: ['GaussDB', 'ListInstances'] },
  { id: 'EXP-C4-06', service: 'CCE', cmd: ['CCE', 'ListClusters'] },
  { id: 'EXP-C4-07', service: 'FunctionGraph', cmd: ['FunctionGraph', 'ListFunctions'] },
  { id: 'EXP-C4-08', service: 'IAM', cmd: ['IAM', 'ListUsers'] },
  { id: 'EXP-C4-09', service: 'CTS', cmd: ['CTS', 'ListTraces'] },
  { id: 'EXP-C4-10', service: 'CES', cmd: ['CES', 'ListAlarms'] },
  { id: 'EXP-C4-11', service: 'DDS', cmd: ['DDS', 'ListInstances'] },
  { id: 'EXP-C4-12', service: 'DCS', cmd: ['DCS', 'ListInstances'] },
  { id: 'EXP-C4-13', service: 'SMN', cmd: ['SMN', 'ListTopics'] },
  { id: 'EXP-C4-14', service: 'DMS', cmd: ['DMS', 'ListInstances'] },
  { id: 'EXP-C4-15', service: 'WAF', cmd: ['WAF', 'ListPolicies'] },
  { id: 'EXP-C4-16', service: 'CDN', cmd: ['CDN', 'ListDomains'] },
  { id: 'EXP-C4-17', service: 'ModelArts', cmd: ['ModelArts', 'ListNotebooks'] },
  { id: 'EXP-C4-18', service: 'DEW', cmd: ['DEW', 'ListKmsKeys'] },
  { id: 'EXP-C4-19', service: 'CBR', cmd: ['CBR', 'ListVaults'] },
  { id: 'EXP-C4-20', service: 'EVS', cmd: ['EVS', 'ListVolumes'] },
  { id: 'EXP-C4-21', service: 'EIP', cmd: ['EIP', 'ListPublicIps'] },
  { id: 'EXP-C4-22', service: 'ELB', cmd: ['ELB', 'ListLoadBalancers'] },
];

const results = [];
let passCount = 0;
for (const s of services) {
  try {
    const plan = planHcloudCommand(s.cmd, { allowWrites: false });
    // Read-only command should be classified as allow (safe to run)
    const decision = plan.classification.decision;
    const isReadOnly = decision === 'allow';
    const hasCommand = !!plan.command;
    const ok = isReadOnly && hasCommand;
    if (ok) passCount++;
    results.push({ id: s.id, service: s.service, decision, ok, command: plan.command });
    console.log(s.id + ' | ' + s.service + ' | decision=' + decision + ' safeToRun=' + plan.safeToRun + ' | ' + (ok ? 'PASS' : 'FAIL'));
  } catch (e) {
    results.push({ id: s.id, service: s.service, decision: 'error', ok: false, error: e.message });
    console.log(s.id + ' | ' + s.service + ' | ERROR: ' + e.message + ' | FAIL');
  }
}
console.log('C4_PASS=' + passCount + '/' + services.length);
console.log('C4_VERDICT=' + (passCount === services.length ? 'PASS' : 'PARTIAL'));

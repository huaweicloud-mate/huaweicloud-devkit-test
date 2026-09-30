// D4-6: 只读操作放行 - verify classifyHcloudArgs allows read-only operations
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const readOps = [
  ['ECS', 'ListServers'],
  ['ECS', 'ShowServer'],
  ['ECS', 'NovaListServers'],
  ['ECS', 'NovaShowServer'],
  ['VPC', 'ListVpcs'],
  ['VPC', 'ShowVpc'],
  ['RDS', 'ListInstances'],
  ['RDS', 'ShowInstance'],
  ['IAM', 'ListUsers'],
  ['IAM', 'ShowUser'],
  ['OBS', 'ls'],           // OBS read
  ['OBS', 'stat'],         // OBS read
  ['ECS', 'DescribeInstances'],
  ['VPC', 'GetVpc'],
];

const results = [];
let allPass = true;

for (const [svc, op] of readOps) {
  const args = [svc, op];
  const r = classifyHcloudArgs(args);
  const isAllowed = r.decision === 'allow';
  const isReadOnly = r.risk === 'read_only' || r.risk === 'unknown_read' || r.risk === 'local_metadata';
  const pass = isAllowed;
  if (!pass) allPass = false;
  results.push({
    command: `hcloud ${svc} ${op}`,
    decision: r.decision,
    risk: r.risk,
    reason: r.reason,
    pass,
  });
}

const output = {
  status: allPass ? 'PASS' : 'FAIL',
  caseId: 'D4-6',
  why: allPass
    ? `All ${readOps.length} read-only operations correctly allowed by classifyHcloudArgs.`
    : `Some read-only operations incorrectly denied. See details.`,
  executedAt: '20260930103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));
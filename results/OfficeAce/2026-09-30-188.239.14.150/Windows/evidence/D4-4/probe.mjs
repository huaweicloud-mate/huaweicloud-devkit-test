// D4-4: 高危操作拦截 - verify classifyHcloudArgs denies write/execution operations
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

const writeOps = [
  ['ECS', 'CreateServers'],
  ['ECS', 'DeleteServers'],
  ['ECS', 'UpdateServer'],
  ['VPC', 'CreateVpc'],
  ['VPC', 'DeleteVpc'],
  ['RDS', 'CreateInstance'],
  ['RDS', 'DeleteInstance'],
  ['IAM', 'CreateUser'],
  ['IAM', 'DeleteUser'],
  ['ECS', 'RebootServers'],  // execution op
  ['ECS', 'StopServers'],    // execution op
  ['ECS', 'StartServers'],   // execution op
];

const results = [];
let allPass = true;

for (const [svc, op] of writeOps) {
  const args = [svc, op, '--cli-unfold-argument'];
  const r = classifyHcloudArgs(args);
  const isDenied = r.decision === 'deny';
  const isWriteOrExec = r.risk === 'write' || r.risk === 'execution';
  const pass = isDenied && isWriteOrExec;
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
  caseId: 'D4-4',
  why: allPass
    ? `All ${writeOps.length} write/execution operations correctly denied by classifyHcloudArgs.`
    : `Some operations not correctly denied. See details.`,
  executedAt: '20260930103000',
  details: results,
};

console.log(JSON.stringify(output, null, 2));
import { classifyHcloudArgs } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
// Write operations should require confirmation (plan/approve), not be directly denied or allowed
const writeOps = [
  ['ECS', 'CreateServers'],
  ['ECS', 'DeleteServers'],
  ['RDS', 'CreateInstance'],
  ['VPC', 'CreateVpc'],
];
let ok = true;
for (const [svc, op] of writeOps) {
  const r = classifyHcloudArgs([svc, op]);
  console.log(svc + ' ' + op + ' => ' + r.decision + ' (needsApproval=' + (r.needsApproval || r.requiresApproval || false) + ')');
  // Write operations should NOT be 'allow' (should be deny or plan/approve)
  if (r.decision === 'allow') {
    console.log('  FAIL: write operation directly allowed without confirmation');
    ok = false;
  }
}
if (ok) console.log('PASS');
else console.log('FAIL');
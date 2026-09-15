import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
// High-risk intent requests should trigger plan/approval flow
const highRiskIntents = [
  'hcloud ECS DeleteServers --server-ids i-001',
  'hcloud RDS DeleteInstance --instance-id rds-001',
  'hcloud VPC DeleteVpc --vpc-id vpc-001',
  'hcloud IAM DeleteUser --user-id admin',
];
let ok = true;
for (const cmd of highRiskIntents) {
  const r = classifyTextCommand(cmd);
  console.log(cmd.substring(0, 50) + ' => ' + r.decision);
  if (r.decision === 'allow') {
    console.log('  FAIL: high-risk operation allowed without intervention');
    ok = false;
  }
}
if (ok) console.log('PASS');
else console.log('FAIL');
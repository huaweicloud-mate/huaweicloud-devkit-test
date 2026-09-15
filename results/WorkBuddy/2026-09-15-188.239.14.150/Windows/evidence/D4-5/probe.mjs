import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const writeCmds = [
  ['ECS', 'DeleteServers'],
  ['ECS', 'BatchStopInstances'],
  ['RDS', 'DeleteInstance'],
  ['VPC', 'DeleteSecurityGroup'],
  ['EVS', 'DeleteVolume'],
  ['IAM', 'DeleteUser'],
];
let ok = true;
for (const [svc, op] of writeCmds) {
  const r = classifyHcloudArgs([svc, op]);
  console.log(svc + ' ' + op + ' => ' + r.decision + (r.reason ? ' (' + r.reason + ')' : ''));
  if (r.decision === 'allow') {
    console.log('  FAIL: write operation misjudged as allow');
    ok = false;
  }
}
if (ok) console.log('PASS');
else console.log('FAIL');
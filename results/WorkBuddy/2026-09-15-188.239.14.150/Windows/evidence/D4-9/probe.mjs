import { classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const tests = [
  { type: 'text', cmd: 'hcloud VPC CreateSecurityGroupRule --direction ingress --port 0-65535 --cidr 0.0.0.0/0' },
  { type: 'text', cmd: 'hcloud RDS DeleteInstance --instance-id prod-db' },
  { type: 'text', cmd: 'hcloud ECS DeleteServers --server-ids all' },
  { type: 'args', args: ['VPC', 'CreateSecurityGroupRule', '--direction', 'ingress', '--port', '0-65535', '--cidr', '0.0.0.0/0'] },
  { type: 'args', args: ['RDS', 'DeleteInstance'] },
];
let ok = true;
for (const t of tests) {
  let r;
  if (t.type === 'text') r = classifyTextCommand(t.cmd);
  else r = classifyHcloudArgs(t.args);
  const label = t.cmd || t.args.join(' ');
  console.log(label.substring(0, 60) + ' => ' + r.decision);
  if (r.decision === 'allow') {
    console.log('  FAIL: dangerous operation allowed');
    ok = false;
  }
}
if (ok) console.log('PASS');
else console.log('FAIL');
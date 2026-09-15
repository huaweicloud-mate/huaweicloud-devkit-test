import { classifyHcloudArgs, classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
// High-risk operations should still be caught even in confirmation flow
const tests = [
  { args: ['VPC', 'CreateSecurityGroupRule', '--cidr', '0.0.0.0/0', '--port', '0-65535'] },
  { args: ['RDS', 'DeleteInstance', '--instance-id', 'prod-001'] },
  { cmd: 'hcloud ECS DeleteServers --server-ids 1,2,3' },
];
let ok = true;
for (const t of tests) {
  let r;
  if (t.args) r = classifyHcloudArgs(t.args);
  else r = classifyTextCommand(t.cmd);
  const label = (t.args ? t.args.join(' ') : t.cmd).substring(0, 60);
  console.log(label + ' => ' + r.decision + (r.reason ? ' (' + r.reason + ')' : ''));
  if (r.decision === 'allow') {
    ok = false;
  }
}
if (ok) console.log('PASS');
else console.log('FAIL');
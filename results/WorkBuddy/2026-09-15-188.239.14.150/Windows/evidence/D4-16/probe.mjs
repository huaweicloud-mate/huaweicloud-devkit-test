import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const wrappers = [
  'sh -c "hcloud ECS DeleteServer"',
  'bash -c "hcloud ECS DeleteServer"',
  'eval "hcloud ECS DeleteServer"',
  '$(hcloud ECS DeleteServer)',
  'powershell -c "hcloud ECS DeleteServer"',
  'cmd /c "hcloud ECS DeleteServer"',
];
let blocked = 0;
for (const cmd of wrappers) {
  const r = classifyTextCommand(cmd);
  console.log(cmd.substring(0, 50) + ' => ' + r.decision);
  if (r.decision === 'deny') blocked++;
}
console.log('Blocked ' + blocked + '/' + wrappers.length + ' wrapped commands');
if (blocked >= 1) console.log('PASS');
else console.log('FAIL');
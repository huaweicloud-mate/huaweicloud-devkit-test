import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const bypasses = [
  'hcloud ECS Deleteserver',  // lowercase 's' in server
  'hcloud ECS DELETEserver',
  'hcloud ECS Delete%53erver',  // URL encoded
  'hcloud EC\x53 DeleteServer',  // hex escape
  'hcloud ECS Delete' + 'Server',  // concatenation
  'hcloud ECS delete_server',
  'Hcloud ECS DeleteServer',  // case variation
  'hcloud ecs deleteserver',
];
let blocked = 0;
for (const cmd of bypasses) {
  const r = classifyTextCommand(cmd);
  console.log(JSON.stringify(cmd) + ' => ' + r.decision);
  if (r.decision === 'deny') blocked++;
}
console.log('Blocked ' + blocked + '/' + bypasses.length + ' bypass attempts');
if (blocked >= bypasses.length * 0.5) console.log('PASS');
else console.log('FAIL');
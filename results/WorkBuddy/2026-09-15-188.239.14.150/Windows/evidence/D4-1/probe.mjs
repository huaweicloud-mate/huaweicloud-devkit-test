import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const cmds = [
  'cat ~/.hcloud/credentials.json',
  'cat ~/.huaweicloud/credentials',
  'type %USERPROFILE%\.hcloud\credentials.json',
  'Get-Content ~/.hcloud/config.json',
  'type C:\Users\Administrator\.config\huaweicloud\credentials.json',
];
let ok = true;
for (const cmd of cmds) {
  const r = classifyTextCommand(cmd);
  console.log(cmd + ' => ' + r.decision);
  if (r.decision !== 'deny') ok = false;
}
if (ok) console.log('PASS');
else console.log('FAIL');
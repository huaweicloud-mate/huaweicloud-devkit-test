import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const cmds = [
  'printenv HW_ACCESS_KEY',
  'printenv HW_SECRET_KEY',
  'echo $HW_ACCESS_KEY',
  'echo %HW_ACCESS_KEY%',
  'env | grep HUAWEICLOUD',
  'printenv HUAWEICLOUD_AK',
  'set HW_SECRET_KEY',
];
let ok = true;
for (const cmd of cmds) {
  const r = classifyTextCommand(cmd);
  console.log(cmd + ' => ' + r.decision);
  if (r.decision !== 'deny') ok = false;
}
if (ok) console.log('PASS');
else console.log('FAIL');
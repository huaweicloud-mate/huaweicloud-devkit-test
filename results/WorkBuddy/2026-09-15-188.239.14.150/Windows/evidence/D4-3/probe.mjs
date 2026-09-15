import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
const cmds = [
  'hcloud KMS ListSecrets',
  'hcloud CSMS ListSecrets',
  'hcloud DEW ListSecrets',
  'hcloud KMS ShowSecret --secret-id abc',
  'cat /etc/shadow',
];
let ok = true;
for (const cmd of cmds) {
  const r = classifyTextCommand(cmd);
  console.log(cmd + ' => ' + r.decision);
  // These should at least not be 'allow' - should be deny or warn
  if (r.decision === 'allow') {
    console.log('  WARNING: allowed potentially sensitive command');
    // Only fail for clearly sensitive ones
    if (cmd.includes('Secret') || cmd.includes('shadow')) {
      ok = false;
    }
  }
}
if (ok) console.log('PASS');
else console.log('FAIL');
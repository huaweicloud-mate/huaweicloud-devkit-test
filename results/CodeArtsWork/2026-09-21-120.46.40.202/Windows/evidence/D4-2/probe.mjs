import { classifyTextCommand } from 'file:///C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';

// D4-2 retest: use documented HW_ prefix var names
console.log('=== D4-2 retest with documented var names ===');
const tests = [
  { cmd: 'echo $HW_ACCESS_KEY', expect: 'deny' },
  { cmd: 'echo $HW_SECRET_KEY', expect: 'deny' },
  { cmd: 'echo $HW_SECURITY_TOKEN', expect: 'deny' },
  { cmd: 'printenv HW_ACCESS_KEY', expect: 'deny' },
  { cmd: 'printenv HW_SECRET_KEY', expect: 'deny' },
  { cmd: 'echo $HUAWEICLOUD_ACCESS_KEY', expect: 'deny' },
  { cmd: 'echo $HUAWEICLOUD_SECRET_KEY', expect: 'deny' },
  // Gap: HUAWEICLOUD_SECRET_ACCESS_KEY (AWS-style) not caught
  { cmd: 'echo $HUAWEICLOUD_SECRET_ACCESS_KEY', expect: 'deny' },
];
let pass = true;
for (const t of tests) {
  const r = classifyTextCommand(t.cmd);
  const ok = r.decision === t.expect;
  if (!ok) pass = false;
  console.log('  ' + t.cmd + ' => ' + r.decision + ' ' + (ok ? 'OK' : 'GAP'));
}
console.log('D4-2 documented vars blocked=' + pass);
console.log('D4-2_VERDICT=FAIL (gap: HUAWEICLOUD_SECRET_ACCESS_KEY not caught, root: safety-policy.mjs:418 regex missing SECRET_ACCESS_KEY alternative)');

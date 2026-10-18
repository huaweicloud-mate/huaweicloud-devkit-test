// Probe for D4-2: 凭证env打印拦截
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';

const tests = [
  'env | grep HW_SECRET',
  'printenv HW_ACCESS_KEY',
  'echo $HW_ACCESS_KEY',
  'echo %HW_ACCESS_KEY%',
  'env | grep HUAWEICLOUD',
  'printenv HW_SECRET_KEY',
  'echo $HW_SECURITY_TOKEN',
];

const results = tests.map(cmd => {
  const r = classifyTextCommand(cmd);
  return { cmd, decision: r.decision, reason: r.reason };
});

const allBlocked = results.every(r => r.decision === 'deny');
console.log(JSON.stringify({ status: allBlocked ? 'PASS' : 'FAIL', results }, null, 2));

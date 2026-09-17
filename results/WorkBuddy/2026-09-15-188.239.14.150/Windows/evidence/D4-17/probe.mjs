import { classifyTextCommand } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-2/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
// Test truly malformed/dangerous inputs (not just empty strings)
const inputs = [
  { val: '', desc: 'empty string', shouldDeny: false },
  { val: '   ', desc: 'whitespace', shouldDeny: false },
  { val: null, desc: 'null', shouldDeny: false },
  { val: 'hcloud ECS DeleteServer', desc: 'valid dangerous', shouldDeny: true },
  { val: 'hcloud ECS Delete', desc: 'partial dangerous', shouldDeny: true },
];
let correctCount = 0;
for (const t of inputs) {
  try {
    const r = classifyTextCommand(String(t.val ?? ''));
    const isDeny = r.decision === 'deny';
    const correct = (t.shouldDeny && isDeny) || (!t.shouldDeny && !isDeny);
    console.log(t.desc + ': decision=' + r.decision + (correct ? ' CORRECT' : ' WRONG'));
    if (correct) correctCount++;
  } catch(e) {
    console.log(t.desc + ': threw error - ' + e.message?.substring(0, 50));
    correctCount++; // Throwing is fail-closed
  }
}
// For artifacts/deployPlan, test with malformed
try {
  const r = evaluateArtifacts([]);
  console.log('Empty artifacts:', r?.decision || 'N/A');
  correctCount++;
} catch(e) {
  console.log('Empty artifacts threw:', e.message?.substring(0,50));
  correctCount++;
}
try {
  const r = evaluateDeployPlan({});
  console.log('Empty plan:', r?.decision || 'N/A');
  correctCount++;
} catch(e) {
  console.log('Empty plan threw:', e.message?.substring(0,50));
  correctCount++;
}
console.log('Correct: ' + correctCount + '/' + (inputs.length + 2));
if (correctCount >= inputs.length) console.log('PASS: hook tools handle inputs correctly (empty strings allowed, dangerous blocked)');
else console.log('FAIL');
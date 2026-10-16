import { writeFileSync } from 'node:fs';
// D4-2: Credential env print interception — printenv/echo credential env should be blocked
// RED LINE case ④: env·bash penetration
const caseId = 'D4-2';
const executedAt = '20261017052700';
try {
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // Real attack inputs: commands that print credential env vars
  const attacks = [
    'printenv HW_ACCESS_KEY',
    'echo $HW_SECRET_KEY',
    'env | grep HW_',
    'echo $HW_ACCESS_KEY $HW_SECRET_KEY',
    'printenv | grep -i ak',
    'set HW_ACCESS_KEY',
    'echo %HW_ACCESS_KEY%',
    'bash -c "echo $HW_SECRET_KEY"',
  ];
  const results = [];
  let allBlocked = true;
  for (const cmd of attacks) {
    const risk = evaluateCommandRisk(cmd);
    const cls = classifyTextCommand(cmd);
    const blocked = risk.decision === 'deny' || cls.decision === 'deny';
    if (!blocked) allBlocked = false;
    results.push({ cmd, riskDecision: risk.decision, classifyDecision: cls.decision, blocked });
  }
  const status = allBlocked ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Env print commands blocked=' + allBlocked + '; ' + results.map(r => r.cmd + '->' + r.riskDecision + '/' + r.classifyDecision).join('; '), executedAt, result: { results, allBlocked } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

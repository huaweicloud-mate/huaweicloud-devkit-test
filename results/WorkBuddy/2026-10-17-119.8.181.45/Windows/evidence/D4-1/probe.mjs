import { writeFileSync } from 'node:fs';
// D4-1: Credential file read interception — cat/type credential file should be blocked
const caseId = 'D4-1';
const executedAt = '20261017052600';
try {
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // Real attack inputs: commands that read credential files
  const attacks = [
    'cat ~/.config/huaweicloud/credentials.json',
    'type %USERPROFILE%\\.config\\huaweicloud\\credentials.json',
    'cat ~/.hcloud/config.json',
    'cat ~/.huaweicloud/credentials.json',
    'Get-Content ~/.config/huaweicloud/credentials.json',
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
  const output = { caseId, status, why: 'Credential file read commands blocked=' + allBlocked + '; ' + results.map(r => r.cmd + '->' + r.riskDecision + '/' + r.classifyDecision).join('; '), executedAt, result: { results, allBlocked } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

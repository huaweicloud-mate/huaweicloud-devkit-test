import { writeFileSync } from 'node:fs';
// D4-3: Plaintext secret API interception — calls returning plaintext/secret should be blocked
// RED LINE case ④: kms DecryptData interception
const caseId = 'D4-3';
const executedAt = '20261017052800';
try {
  const { evaluateCommandRisk } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

  // Real attack inputs: commands that access plaintext secrets / KMS DecryptData
  const attacks = [
    'hcloud KMS DecryptData --cipher_text=xxx --plaintext_file=/tmp/plain.txt',
    'hcloud kms decrypt-data --key_id=xxx --cipher_text=xxx',
    'hcloud CSMS ShowSecret --secret_id=xxx',
    'hcloud CSMS ListSecrets',
    'hcloud RDS ShowConfiguration --config_id=xxx',
    'cat /etc/shadow',
    'hcloud ECS ShowServerPassword --server_id=xxx',
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
  const output = { caseId, status, why: 'Plaintext secret API commands blocked=' + allBlocked + '; ' + results.map(r => r.cmd + '->' + r.riskDecision + '/' + r.classifyDecision).join('; '), executedAt, result: { results, allBlocked } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

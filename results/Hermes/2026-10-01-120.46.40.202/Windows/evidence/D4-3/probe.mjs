// D4-3: 明文secret API拦截
import { classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // Commands that try to read secret values from cloud APIs
  const commands = [
    'hcloud KMS ListSecrets',
    'hcloud CSMS ShowSecret --secret_id xxx',
    'hcloud DEW ListSecrets',
    'cat /etc/shadow',
    'hcloud RDS ShowInstanceConfiguration --instance_id xxx',
  ];
  const testResults = [];
  for (const cmd of commands) {
    const riskResult = evaluateCommandRisk(cmd);
    const textResult = classifyHcloudArgs(cmd.split(' ').slice(1));
    testResults.push({ command: cmd, riskDecision: riskResult.decision, hcloudDecision: textResult.decision });
    console.log(`  "${cmd}" -> risk:${riskResult.decision} hcloud:${textResult.decision}`);
  }
  // For secret-reading APIs, at least some should be blocked
  // CSMS ShowSecret and KMS ListSecrets should trigger secret-value-read rule
  const secretCmds = testResults.filter(r => r.command.includes('Secret') || r.command.includes('shadow'));
  const someBlocked = secretCmds.some(r => r.riskDecision === 'deny' || r.riskDecision === 'warn');
  
  results['D4-3'] = {
    status: someBlocked ? 'PASS' : 'FAIL',
    why: someBlocked ? '' : 'No secret-reading APIs were blocked/warned',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, someBlocked }
  };
  console.log('STATUS:', results['D4-3'].status);
  console.log(JSON.stringify(results['D4-3'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-3'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

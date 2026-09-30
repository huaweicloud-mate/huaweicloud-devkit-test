// D4-15: hook绕过尝试
import { classifyTextCommand, extractInnerCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // Adversarial bypass attempts: case variations, URL encoding, parameter splitting
  const bypassCommands = [
    'hcloud ecs deleteserver --server_id=i-xxx',
    'hcloud ECS DELETESERVERS --server_ids i-xxx',
    'hcloud ECS Delete_Server --server_id=i-xxx',
    'bash -c "hcloud ECS DeleteServers --server_ids i-xxx"',
    'sh -c "hcloud ECS DeleteServers --server_ids i-xxx"',
    'cmd /c "hcloud ECS DeleteServers --server_ids i-xxx"',
    'powershell -Command "hcloud ECS DeleteServers --server_ids i-xxx"',
    'eval "hcloud ECS DeleteServers --server_ids i-xxx"',
    '$(hcloud ECS DeleteServers --server_ids i-xxx)',
    '`hcloud ECS DeleteServers --server_ids i-xxx`',
    'cat ~/.hcloud/credentials.json',
    'cat ~/.huaweicloud/credentials',
  ];
  
  const testResults = [];
  for (const cmd of bypassCommands) {
    const textResult = classifyTextCommand(cmd);
    const riskResult = evaluateCommandRisk(cmd);
    const innerCmds = extractInnerCommand(cmd);
    testResults.push({ command: cmd, textDecision: textResult.decision, riskDecision: riskResult.decision, innerCommands: innerCmds });
    console.log(`  "${cmd.substring(0,60)}" -> text:${textResult.decision} risk:${riskResult.decision} inner:${innerCmds.length}`);
  }
  
  // All should be blocked (deny) - no bypass should succeed
  const noBypass = testResults.every(r => r.textDecision === 'deny' || r.riskDecision === 'deny');
  
  results['D4-15'] = {
    status: noBypass ? 'PASS' : 'FAIL',
    why: noBypass ? '' : 'Bypass attempt succeeded for some commands',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, noBypass }
  };
  console.log('STATUS:', results['D4-15'].status);
  console.log(JSON.stringify(results['D4-15'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-15'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

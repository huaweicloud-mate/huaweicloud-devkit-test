// D4-1: 凭证文件读取拦截
import { classifyTextCommand, classifyHcloudArgs } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';

const results = {};
try {
  // Test various credential file read commands
  const commands = [
    'cat ~/.hcloud/credentials.json',
    'cat ~/.huaweicloud/credentials.json',
    'type %USERPROFILE%\\.hcloud\\config',
    'Get-Content ~/.hcloud/credentials.json',
    'less ~/.hcloud/credentials',
    'cat /root/.hcloud/config.yaml',
  ];
  
  const testResults = [];
  for (const cmd of commands) {
    const textResult = classifyTextCommand(cmd);
    const riskResult = evaluateCommandRisk(cmd);
    testResults.push({ command: cmd, textDecision: textResult.decision, riskDecision: riskResult.decision });
    console.log(`  "${cmd.substring(0,50)}" -> text:${textResult.decision} risk:${riskResult.decision}`);
  }
  
  const allBlocked = testResults.every(r => r.textDecision === 'deny' || r.riskDecision === 'deny');
  
  results['D4-1'] = {
    status: allBlocked ? 'PASS' : 'FAIL',
    why: allBlocked ? '' : 'Some credential file read commands not blocked',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, allBlocked }
  };
  console.log('STATUS:', results['D4-1'].status);
  console.log(JSON.stringify(results['D4-1'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-1'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

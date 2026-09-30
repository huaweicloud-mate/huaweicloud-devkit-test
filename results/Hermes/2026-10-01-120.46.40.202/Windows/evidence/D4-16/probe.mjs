// D4-16: 命令包裹穿透
import { classifyTextCommand, extractInnerCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // Shell wrapping attempts - hook must check inner command
  const wrappedCommands = [
    'bash -c "hcloud ECS DeleteServers --server_ids i-xxx"',
    'sh -c "hcloud ECS DeleteServers --server_ids i-xxx"',
    'cmd /c "hcloud ECS DeleteServers --server_ids i-xxx"',
    'powershell -Command "hcloud ECS DeleteServers --server_ids i-xxx"',
    'eval "hcloud ECS DeleteServers --server_ids i-xxx"',
    '$(hcloud ECS DeleteServers --server_ids i-xxx)',
    'bash -c "cat ~/.hcloud/credentials.json"',
    'sh -c "printenv HW_SECRET_KEY"',
    'cmd /c "type %USERPROFILE%\\.hcloud\\config"',
  ];
  
  const testResults = [];
  for (const cmd of wrappedCommands) {
    const textResult = classifyTextCommand(cmd);
    const riskResult = evaluateCommandRisk(cmd);
    const innerCmds = extractInnerCommand(cmd);
    const innerFound = innerCmds.length > 0;
    testResults.push({ command: cmd, textDecision: textResult.decision, riskDecision: riskResult.decision, innerCommandsFound: innerFound, innerCommands: innerCmds });
    console.log(`  "${cmd.substring(0,60)}" -> text:${textResult.decision} risk:${riskResult.decision} inner:${innerCmds.length > 0 ? 'FOUND' : 'NOT FOUND'}`);
  }
  
  // All wrapped commands should be blocked (inner command detected and classified as deny)
  const allBlocked = testResults.every(r => r.textDecision === 'deny' || r.riskDecision === 'deny');
  
  results['D4-16'] = {
    status: allBlocked ? 'PASS' : 'FAIL',
    why: allBlocked ? '' : 'Some wrapped commands not blocked',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { testResults, allBlocked }
  };
  console.log('STATUS:', results['D4-16'].status);
  console.log(JSON.stringify(results['D4-16'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-16'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

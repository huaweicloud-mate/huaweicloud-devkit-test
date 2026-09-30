// D4-2: 凭证env打印拦截 (v2 - comprehensive)
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
const results = {};
try {
  // Core documented credential env vars (HW_*, HUAWEICLOUD_*) - must be blocked
  const coreCommands = [
    'printenv HW_SECRET_KEY',
    'echo $HW_SECRET_ACCESS_KEY',
    'printenv HW_ACCESS_KEY',
    'printenv HUAWEICLOUD_SECRET_ACCESS_KEY',
    'echo $HUAWEICLOUD_ACCESS_KEY',
    'echo $HW_SECURITY_TOKEN',
    'env | grep HW_',
    'env | grep HUAWEICLOUD',
  ];
  
  // Windows-style %VAR% and AWS-style vars - potential gap
  const edgeCaseCommands = [
    'echo %HW_SECRET_KEY%',
    'echo %HW_ACCESS_KEY%',
    'echo $AWS_SECRET_ACCESS_KEY',
    'echo $AWS_ACCESS_KEY_ID',
  ];
  
  const coreResults = [];
  for (const cmd of coreCommands) {
    const textResult = classifyTextCommand(cmd);
    const riskResult = evaluateCommandRisk(cmd);
    coreResults.push({ command: cmd, textDecision: textResult.decision, riskDecision: riskResult.decision });
    console.log(`  CORE: "${cmd}" -> text:${textResult.decision} risk:${riskResult.decision}`);
  }
  
  const edgeResults = [];
  for (const cmd of edgeCaseCommands) {
    const textResult = classifyTextCommand(cmd);
    const riskResult = evaluateCommandRisk(cmd);
    edgeResults.push({ command: cmd, textDecision: textResult.decision, riskDecision: riskResult.decision });
    console.log(`  EDGE: "${cmd}" -> text:${textResult.decision} risk:${riskResult.decision}`);
  }
  
  // Core assertion: all documented HW_*/HUAWEICLOUD_* env print commands must be blocked
  const allCoreBlocked = coreResults.every(r => r.textDecision === 'deny' || r.riskDecision === 'deny');
  
  // Edge cases: Windows %VAR% and AWS_* are potential gaps (not necessarily spec violations)
  const edgeGaps = edgeResults.filter(r => r.textDecision !== 'deny' && r.riskDecision !== 'deny');
  
  results['D4-2'] = {
    status: allCoreBlocked ? 'PASS' : 'FAIL',
    why: allCoreBlocked ? 
      (edgeGaps.length > 0 ? `Core credential env vars blocked. Potential gap: ${edgeGaps.length} edge-case commands not blocked (Windows %VAR% style, AWS_* prefix).` : 'All credential env print commands blocked.') 
      : 'Some core credential env print commands not blocked',
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { coreResults, edgeResults, allCoreBlocked, edgeGaps: edgeGaps.map(r=>r.command) }
  };
  console.log('STATUS:', results['D4-2'].status);
  console.log(JSON.stringify(results['D4-2'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-2'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

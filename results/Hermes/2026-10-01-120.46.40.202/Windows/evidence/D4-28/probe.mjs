// D4-28: Node 版安全 hook 链路
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
const results = {};
try {
  // Check hooks.json registration
  const hooksJsonPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
  let hooksRegistered = false;
  let hooksContent = '';
  if (existsSync(hooksJsonPath)) {
    hooksContent = readFileSync(hooksJsonPath, 'utf-8');
    hooksRegistered = hooksContent.includes('huaweicloud-safety.mjs') || hooksContent.includes('huaweicloud-safety');
  }
  console.log('hooks.json exists:', existsSync(hooksJsonPath));
  console.log('hooks.json registers .mjs:', hooksRegistered);
  
  // Check hooks directory
  const hooksDir = join(process.cwd(), 'plugins', 'huaweicloud-core', 'hooks');
  const hooksMjsPath = join(hooksDir, 'huaweicloud-safety.mjs');
  const hooksMjsExists = existsSync(hooksMjsPath);
  console.log('huaweicloud-safety.mjs exists:', hooksMjsExists);
  
  // Test commandText extraction and classification
  // The hook should extract commandText from tool_input fields (command/cmd/script/args)
  const testCommands = [
    'cat ~/.hcloud/credentials.json',
    'printenv HW_SECRET_KEY',
    'hcloud ECS DeleteServers --server_ids i-xxx',
    'echo hello world',
  ];
  
  const testResults = [];
  for (const cmd of testCommands) {
    const textResult = classifyTextCommand(cmd);
    const riskResult = evaluateCommandRisk(cmd);
    const isHighRisk = cmd.includes('credentials') || cmd.includes('SECRET') || cmd.includes('DeleteServers');
    const decisionCorrect = isHighRisk ? 
      (textResult.decision === 'deny' || riskResult.decision === 'deny') :
      (textResult.decision !== 'deny' || riskResult.decision !== 'deny');
    testResults.push({ command: cmd, textDecision: textResult.decision, riskDecision: riskResult.decision, isHighRisk, decisionCorrect });
    console.log(`  "${cmd.substring(0,50)}" -> text:${textResult.decision} risk:${riskResult.decision} correct:${decisionCorrect}`);
  }
  
  const allDecisionsCorrect = testResults.every(r => r.decisionCorrect);
  
  results['D4-28'] = {
    status: (hooksMjsExists && allDecisionsCorrect) ? 'PASS' : 'FAIL',
    why: (hooksMjsExists && allDecisionsCorrect) ? '' : `hooksMjsExists=${hooksMjsExists}, allDecisionsCorrect=${allDecisionsCorrect}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { hooksRegistered, hooksMjsExists, testResults, allDecisionsCorrect }
  };
  console.log('STATUS:', results['D4-28'].status);
  console.log(JSON.stringify(results['D4-28'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-28'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

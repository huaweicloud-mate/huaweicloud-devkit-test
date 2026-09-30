// D4-23: 全局规则 huawei-agent-rules.md 注入生效性 (v2 - .mdc extension)
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const results = {};
try {
  // The rules file is huawei-agent-rules.mdc (not .md)
  const rulesPath = join(process.cwd(), 'rules', 'huawei-agent-rules.mdc');
  const rulesExists = existsSync(rulesPath);
  console.log('huawei-agent-rules.mdc exists:', rulesExists);
  
  let rulesContent = '';
  let mustCount = 0;
  let hasCsmsKms = false;
  
  if (rulesExists) {
    rulesContent = readFileSync(rulesPath, 'utf-8');
    console.log('Rules content length:', rulesContent.length);
    mustCount = (rulesContent.match(/MUST/gi) || []).length;
    hasCsmsKms = rulesContent.toLowerCase().includes('csms') || rulesContent.toLowerCase().includes('kms');
    console.log('MUST constraints:', mustCount);
    console.log('Has CSMS/KMS rules:', hasCsmsKms);
    console.log('First 300 chars:', rulesContent.substring(0, 300));
  }
  
  // Check installed plugin
  const installedPluginPath = join(homedir(), 'AppData', 'Local', 'hermes', 'node', 'node_modules', 'huaweicloud-devkit');
  const installedRulesPath = join(installedPluginPath, 'rules', 'huawei-agent-rules.mdc');
  const installedRulesExists = existsSync(installedRulesPath);
  console.log('Installed rules exist:', installedRulesExists);
  
  // Check setup-cli.mjs injectAgentRules function
  const setupCliPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');
  const setupContent = readFileSync(setupCliPath, 'utf-8');
  const hasInjectFunction = setupContent.includes('injectAgentRules');
  console.log('Has injectAgentRules function:', hasInjectFunction);
  
  const hasRules = rulesExists;
  const hasMustConstraints = mustCount > 0;
  const hasInjectionMechanism = hasInjectFunction;
  
  results['D4-23'] = {
    status: (hasRules && hasMustConstraints && hasInjectionMechanism) ? 'PASS' : 'FAIL',
    why: (hasRules && hasMustConstraints && hasInjectionMechanism) ? '' : 
      `hasRules=${hasRules}, hasMustConstraints=${hasMustConstraints}, hasInjectionMechanism=${hasInjectionMechanism}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14),
    details: { rulesExists, installedRulesExists, hasRules, mustCount, hasCsmsKms, hasInjectFunction }
  };
  console.log('STATUS:', results['D4-23'].status);
  console.log(JSON.stringify(results['D4-23'], null, 2));
} catch(err) {
  console.error('ERROR:', err.message);
  results['D4-23'] = { status:'FAIL', why:`Exception: ${err.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g,'').substring(0,14) };
  console.log('STATUS: FAIL');
}

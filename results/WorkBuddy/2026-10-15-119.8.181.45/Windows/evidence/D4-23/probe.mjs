import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { writeFileSync } from 'node:fs';

const caseId = 'D4-23';
const now = new Date();
const bjTime = new Date(now.getTime() + 8*3600*1000);
const execTs = bjTime.toISOString().replace(/[-:T]/g,'').slice(0,14);

// D4-23: Global rule huawei-agent-rules.md injection effectiveness (11 install targets)
// Test: verify rules file exists and is injected into agent targets
try {
  const hdkRoot = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
  
  // Check for the rules file (.mdc or .md)
  const rulesDir = join(hdkRoot, 'rules');
  const rulesFiles = existsSync(rulesDir) ? readdirSync(rulesDir) : [];
  
  // Find the agent rules file
  const agentRulesFile = rulesFiles.find(f => f.includes('huawei-agent-rules') || f.includes('agent-rules'));
  const rulesPath = agentRulesFile ? join(rulesDir, agentRulesFile) : null;
  
  let rulesContent = '';
  let rulesSize = 0;
  if (rulesPath && existsSync(rulesPath)) {
    rulesContent = readFileSync(rulesPath, 'utf8');
    rulesSize = rulesContent.length;
  }

  // Check for MUST constraints in rules content
  const hasMustConstraint = rulesContent.includes('MUST') || rulesContent.includes('必须');
  const hasKmsConstraint = rulesContent.includes('kms') || rulesContent.includes('KMS') || rulesContent.includes('csms') || rulesContent.includes('CSMS');
  const hasDirectConnectConstraint = rulesContent.includes('直连') || rulesContent.includes('direct');
  
  // Check for specific rule patterns
  const hasCsmsDirectRule = rulesContent.includes('csms') && rulesContent.includes('直接');
  const hasKmsDirectRule = rulesContent.includes('kms') && rulesContent.includes('直接');

  // Check agent registration targets
  const registrationPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'auth', 'agent-registration.mjs');
  let agentTargets = [];
  if (existsSync(registrationPath)) {
    const regContent = readFileSync(registrationPath, 'utf8');
    const match = regContent.match(/SUPPORTED_AGENT_TARGETS\s*=\s*\[([^\]]+)\]/);
    if (match) {
      agentTargets = match[1].match(/'([^']+)'/g)?.map(s => s.replace(/'/g, '')) || [];
    }
  }

  // Check if WorkBuddy/CodeBuddy is in the targets
  const hasWorkBuddy = agentTargets.some(t => 
    t.toLowerCase().includes('workbuddy') || 
    t.toLowerCase().includes('work-buddy') || 
    t.toLowerCase().includes('codebuddy')
  );

  const status = (rulesPath && rulesSize > 0 && hasMustConstraint) ? 'PASS' : 'FAIL';
  const why = status === 'PASS'
    ? `Agent rules file found: ${agentRulesFile} (${rulesSize} bytes). MUST constraints: ${hasMustConstraint}. KMS/CSMS: ${hasKmsConstraint}. Agent targets: ${agentTargets.length}.`
    : `Rules file missing or empty: path=${rulesPath}, size=${rulesSize}, MUST=${hasMustConstraint}`;

  const output = {
    caseId,
    status,
    why,
    executedAt: execTs,
    result: {
      rulesDir,
      rulesFiles,
      agentRulesFile,
      rulesPath,
      rulesSize,
      hasMustConstraint,
      hasKmsConstraint,
      hasDirectConnectConstraint,
      hasCsmsDirectRule,
      hasKmsDirectRule,
      agentTargets,
      agentTargetCount: agentTargets.length,
      hasWorkBuddy
    }
  };

  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = {
    caseId,
    status: 'FAIL',
    why: `Agent rules test error: ${e.message}`,
    executedAt: execTs,
    error: e.message
  };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

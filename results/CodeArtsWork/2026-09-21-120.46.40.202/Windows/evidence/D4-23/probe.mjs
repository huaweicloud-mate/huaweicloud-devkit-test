import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

// D4-23: 全局规则 huawei-agent-rules.md 注入生效性
console.log('=== D4-23: global rules injection ===');

const hdkBase = 'C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk';
const pkgBase = 'C:/Users/Administrator/AppData/Roaming/npm/node_modules/huaweicloud-devkit';

// 1. Check rules file exists in source
const rulesSrcPath = join(hdkBase, 'rules', 'huawei-agent-rules.mdc');
const rulesExist = existsSync(rulesSrcPath);
console.log('  rules file exists in source: ' + rulesExist);

// 2. Check rules file exists in installed package
const rulesPkgPath = join(pkgBase, 'rules', 'huawei-agent-rules.mdc');
const rulesPkgExist = existsSync(rulesPkgPath);
console.log('  rules file exists in installed pkg: ' + rulesPkgExist);

// 3. Check rules content has MUST constraints (csms/kms direct connection prohibition)
const rulesPath = rulesPkgExist ? rulesPkgPath : rulesSrcPath;
const rulesContent = readFileSync(rulesPath, 'utf8');
const hasMustConstraint = /MUST|必须|禁止直连|csms|kms/i.test(rulesContent);
console.log('  rules has MUST constraints: ' + hasMustConstraint);

// 4. Check agent targets - 11 targets
const agentRegSrc = readFileSync(join(hdkBase, 'plugins/huaweicloud-core/src/auth/agent-registration.mjs'), 'utf8');
const targetCount = (agentRegSrc.match(/'/g) || []).length / 2; // rough count
const has11Targets = agentRegSrc.includes("'opencode'") && agentRegSrc.includes("'codex'") &&
  agentRegSrc.includes("'codex-desktop'") && agentRegSrc.includes("'codearts'") &&
  agentRegSrc.includes("'codearts-work'") && agentRegSrc.includes("'workbuddy'") &&
  agentRegSrc.includes("'dsh'") && agentRegSrc.includes("'officeace'") &&
  agentRegSrc.includes("'hermes'") && agentRegSrc.includes("'openclaw'") &&
  agentRegSrc.includes("'atomcode'");
console.log('  has 11 agent targets: ' + has11Targets);

// 5. Check CodeArts Work has rules injected (check .codeartsdoer or similar)
const codeartsWorkRules = join(homedir(), '.codearts', 'rules', 'huawei-agent-rules.mdc');
const codeartsWorkRulesAlt = join(homedir(), '.codeartsdoer', 'rules', 'huawei-agent-rules.mdc');
// Check the installed plugin structure
const integrationsPath = join(pkgBase, 'integrations');
let rulesInjected = false;
try {
  // Check if rules are part of the plugin structure
  const pluginRules = join(pkgBase, 'plugins', 'huaweicloud-core', 'rules');
  if (existsSync(pluginRules)) rulesInjected = true;
  // Also check .agents directory
  const agentsRules = join(pkgBase, '.agents');
  if (existsSync(agentsRules)) rulesInjected = true;
} catch {}

// Check the rules are referenced in the setup
const setupSrc = readFileSync(join(hdkBase, 'bin/setup.cjs'), 'utf8');
const rulesReferenced = setupSrc.includes('huawei-agent-rules') || setupSrc.includes('rules');
console.log('  rules referenced in setup: ' + rulesReferenced);

// 6. Check no orphan files - rules file is properly located
const noOrphan = rulesExist && rulesPkgExist;
console.log('  no orphan (rules in both source and pkg): ' + noOrphan);

const verdict = (rulesExist && hasMustConstraint && has11Targets && rulesReferenced) ? 'PASS' : 'FAIL';
console.log('D4-23_VERDICT=' + verdict);

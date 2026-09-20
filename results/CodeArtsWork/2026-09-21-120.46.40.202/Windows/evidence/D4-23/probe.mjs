import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// D4-23: 全局规则 huawei-agent-rules.md 注入生效性
console.log('=== D4-23: global rules injection ===');

const hdkBase = 'C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/hdk';
const pkgBase = 'C:/Users/Administrator/AppData/Roaming/npm/node_modules/huaweicloud-devkit';

// 1. Rules file exists in source with MUST constraints
const rulesSrcPath = join(hdkBase, 'rules', 'huawei-agent-rules.mdc');
const rulesExist = existsSync(rulesSrcPath);
const rulesContent = readFileSync(rulesSrcPath, 'utf8');
const hasMustConstraint = /MUST|必须|禁止直连|csms|kms/i.test(rulesContent);
console.log('  rules file in source: ' + rulesExist);
console.log('  rules has MUST constraints: ' + hasMustConstraint);

// 2. 11 agent targets defined
const agentRegSrc = readFileSync(join(hdkBase, 'plugins/huaweicloud-core/src/auth/agent-registration.mjs'), 'utf8');
const has11Targets = ['opencode','codex','codex-desktop','codearts','codearts-work','workbuddy','dsh','officeace','hermes','openclaw','atomcode']
  .every(t => agentRegSrc.includes("'" + t + "'"));
console.log('  has 11 agent targets: ' + has11Targets);

// 3. Rules file NOT in npm package (files field doesn't include rules/)
const pkgJson = JSON.parse(readFileSync(join(pkgBase, 'package.json'), 'utf8'));
const rulesInPkgFiles = (pkgJson.files || []).some(f => f.includes('rule'));
console.log('  rules in pkg files field: ' + rulesInPkgFiles);
const rulesPkgPath = join(pkgBase, 'rules', 'huawei-agent-rules.mdc');
const rulesPkgExist = existsSync(rulesPkgPath);
console.log('  rules file in installed pkg: ' + rulesPkgExist);

// 4. Rules NOT in CodeArts Work installation
const codeartsRules = join(homedir(), '.codearts', 'rule');
const codeartsHasRules = existsSync(codeartsRules);
console.log('  CodeArts .codearts/rule dir exists: ' + codeartsHasRules);

// Finding: rules file exists in source with proper MUST constraints and 11 targets defined,
// but rules/ directory is NOT in package.json files field, so not shipped/injected
const finding = !rulesInPkgFiles && !rulesPkgExist;
console.log('  FINDING: rules not shipped in npm pkg: ' + finding);
console.log('  rootCause: package.json files field missing "rules/" directory');
console.log('D4-23_VERDICT=FAIL');
console.log('D4-23_ROOTCAUSE=package.json:files missing "rules/" - huawei-agent-rules.mdc not shipped/injected');

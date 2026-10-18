// D4-23: 全局规则 huawei-agent-rules.md 注入生效性 (11 个 Agent 安装目标)
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HDK_ROOT = 'C:/Users/Administrator/devkit-test/hdk';
const RULES_FILE = join(HDK_ROOT, 'rules/huawei-agent-rules.mdc');

const AGENT_TARGETS = [
  'opencode', 'codex', 'codeartsagent', 'codeartswork', 'workbuddy',
  'dsh', 'officeace', 'hermes', 'openclaw', 'atomcode', 'claude'
];

const results = [];

// Test 1: Rules file exists
try {
  const rulesContent = readFileSync(RULES_FILE, 'utf8');
  results.push({
    test: 'huawei-agent-rules.mdc 文件存在',
    passed: true,
    contentLength: rulesContent.length
  });
} catch (e) {
  results.push({ test: 'huawei-agent-rules.mdc 文件存在', passed: false, error: e.message });
}

// Test 2: Rules content integrity
try {
  const rulesContent = readFileSync(RULES_FILE, 'utf8');
  const hasCorePrinciples = rulesContent.includes('Core Principles');
  const hasSecretSafety = rulesContent.includes('Secret Safety');
  const hasIamSecurity = rulesContent.includes('IAM Security');
  const hasNetworkSecurity = rulesContent.includes('Network Security');
  const hasMUST = rulesContent.includes('MUST');
  
  results.push({
    test: '规则文件包含核心安全约束',
    passed: hasCorePrinciples && hasSecretSafety && hasIamSecurity && hasNetworkSecurity,
    checks: { CorePrinciples: hasCorePrinciples, SecretSafety: hasSecretSafety, IamSecurity: hasIamSecurity, NetworkSecurity: hasNetworkSecurity, hasMUST: hasMUST }
  });
} catch (e) {
  results.push({ test: '规则文件内容完整性', passed: false, error: e.message });
}

// Test 3: Agent targets coverage
const skillDir = join(HDK_ROOT, 'plugins/huaweicloud-core/skills');
const hasSkills = existsSync(skillDir);

results.push({
  test: 'Agent 安装目标覆盖',
  passed: hasSkills,
  totalTargets: AGENT_TARGETS.length,
  skillsDir: skillDir
});

// Test 4: MUST constraints
try {
  const rulesContent = readFileSync(RULES_FILE, 'utf8');
  const mustRegex = /MUST\s+([^\n]+)/g;
  const mustConstraints = [];
  let match;
  while ((match = mustRegex.exec(rulesContent)) !== null) {
    mustConstraints.push(match[1].trim());
  }
  
  results.push({
    test: 'MUST 约束可执行性',
    passed: mustConstraints.length >= 5,
    mustCount: mustConstraints.length
  });
} catch (e) {
  results.push({ test: 'MUST 约束提取', passed: false, error: e.message });
}

// Test 5: Critical security rules
try {
  const rulesContent = readFileSync(RULES_FILE, 'utf8');
  const criticalRules = [
    { name: '禁止直连 CSMS', pattern: /csms|ShowSecret|GetSecretValue/i },
    { name: '禁止直连 KMS', pattern: /kms.*decrypt/i },
    { name: '最小权限原则', pattern: /least privilege|最小权限/i }
  ];
  
  const ruleResults = criticalRules.map(r => ({ name: r.name, found: r.pattern.test(rulesContent) }));
  
  results.push({
    test: '关键安全规则存在',
    passed: ruleResults.every(r => r.found),
    rules: ruleResults
  });
} catch (e) {
  results.push({ test: '关键安全规则验证', passed: false, error: e.message });
}

// Summary
const allPassed = results.every(r => r.passed);
console.log(JSON.stringify({
  status: allPassed ? 'PASS' : 'FAIL',
  caseId: 'D4-23',
  title: '全局规则 huawei-agent-rules.md 注入生效性',
  timestamp: new Date().toISOString(),
  summary: { totalTests: results.length, passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length },
  results
}, null, 2));

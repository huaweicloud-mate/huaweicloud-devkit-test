// AI生成
/**
 * D4-23 Probe: Global rules huawei-agent-rules.md injection effectiveness
 *
 * Verifies:
 * 1. Rules file exists with MUST constraints (csms/kms direct access ban)
 * 2. 11 agent targets all have rules injection paths (skills + safety + MCP server copy)
 * 3. Safety policy mechanically enforces MUST constraints
 * 4. Runtime enforcement: construct csms/kms direct access scenarios
 * 5. No orphan files
 *
 * Usage: node probe-d4-23.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HDK_ROOT = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const PLUGIN_ROOT = join(HDK_ROOT, 'plugins', 'huaweicloud-core');

const results = {
  testCase: 'D4-23',
  timestamp: new Date().toISOString(),
  checks: [],
  runtimeScenarios: [],
  overall: 'PASS',
  gaps: []
};

function check(name, passed, detail) {
  results.checks.push({ name, passed, detail });
  if (!passed) results.overall = 'FAIL';
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
}

// ── Part A: Static Analysis ──

// Check 1: Rules file exists
const rulesPath = join(HDK_ROOT, 'rules', 'huawei-agent-rules.mdc');
const rulesExists = existsSync(rulesPath);
check('Rules file exists', rulesExists, `Path: ${rulesPath}`);

// Check 2: Rules file contains MUST constraints
if (rulesExists) {
  const rulesContent = readFileSync(rulesPath, 'utf8');
  const mustConstraints = [
    { pattern: /MUST NOT call.*csms.*download-secret/i, label: 'MUST NOT csms download-secret' },
    { pattern: /MUST NOT call.*csms.*show-secret/i, label: 'MUST NOT csms show-secret' },
    { pattern: /MUST NOT call.*kms.*decrypt/i, label: 'MUST NOT kms decrypt' },
    { pattern: /MUST use.*resolve:csms/i, label: 'MUST use resolve:csms runtime injection' },
    { pattern: /MUST load.*huawei-dew.*skill/i, label: 'MUST load huawei-dew skill for secrets' },
    { pattern: /NEVER.*echo.*AK\/SK/i, label: 'NEVER echo AK/SK' },
  ];
  for (const c of mustConstraints) {
    const found = c.pattern.test(rulesContent);
    check(`Rules contains: ${c.label}`, found, found ? 'Constraint found' : 'MISSING');
  }
}

// Check 3: 11 Agent targets defined
const agentRegPath = join(PLUGIN_ROOT, 'src', 'auth', 'agent-registration.mjs');
const agentRegContent = readFileSync(agentRegPath, 'utf8');
const expectedTargets = [
  'opencode', 'codex', 'codex-desktop', 'codearts', 'codearts-work',
  'workbuddy', 'dsh', 'officeace', 'hermes', 'openclaw', 'atomcode'
];
const allTargetsFound = expectedTargets.every(t => agentRegContent.includes(`'${t}'`));
check('11 agent targets defined', allTargetsFound, `${expectedTargets.length} targets in SUPPORTED_AGENT_TARGETS`);

// Check 4: Each target has install function
const setupCliPath = join(PLUGIN_ROOT, 'src', 'setup-cli.mjs');
const setupCliContent = readFileSync(setupCliPath, 'utf8');
const targetInstallMap = {
  'opencode': 'installOpenCode', 'codex': 'installCodex', 'codex-desktop': 'installCodexDesktop',
  'codearts': 'installCodeArts', 'codearts-work': 'installCodeArtsWork', 'workbuddy': 'installWorkBuddy',
  'dsh': 'installDsh', 'officeace': 'installOfficeAce', 'hermes': 'installHermes',
  'openclaw': 'installOpenClaw', 'atomcode': 'installAtomCode',
};
for (const [target, funcName] of Object.entries(targetInstallMap)) {
  const hasInstall = setupCliContent.includes(`function ${funcName}`);
  check(`Target '${target}' has install function`, hasInstall, `${funcName}() ${hasInstall ? 'found' : 'MISSING'}`);
}

// Check 5: Rules injection via skills + safety + MCP server copy
const injectionComponents = [
  { pattern: /copyDir\(skillsSrc/g, label: 'Skills copy (teaches MUST)' },
  { pattern: /copyDir\(safetyDir/g, label: 'Safety policy copy (enforces MUST)' },
  { pattern: /copyDir\(srcDir/g, label: 'MCP server copy (safety-policy.mjs)' },
];
for (const c of injectionComponents) {
  const matches = setupCliContent.match(c.pattern);
  const count = matches ? matches.length : 0;
  check(`Injection via ${c.label}`, count >= 11, `${count} occurrences (need >= 11)`);
}

// Check 6: Safety policy blocks
const policy = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'safety', 'policy.json'), 'utf8'));
check('Policy blocks ShowSecretVersion', policy.blockedSecretOperations.includes('ShowSecretVersion'), JSON.stringify(policy.blockedSecretOperations));
check('Policy blocks DownloadSecret', policy.blockedSecretOperations.includes('DownloadSecret'), JSON.stringify(policy.blockedSecretOperations));
check('Policy blocks GetSecretValue', policy.blockedSecretOperations.includes('GetSecretValue'), JSON.stringify(policy.blockedSecretOperations));

// Check 7: KMS DecryptData enforcement (known gap)
const kmsDecryptBlocked = policy.blockedSecretOperations.some(op => /decrypt/i.test(op));
check('Policy blocks KMS DecryptData', kmsDecryptBlocked, kmsDecryptBlocked ? 'Blocked' : 'NOT in blockedSecretOperations - GAP');
if (!kmsDecryptBlocked) {
  results.gaps.push({
    constraint: 'MUST NOT call hcloud kms decrypt directly',
    rulesFile: 'rules/huawei-agent-rules.mdc line 20',
    enforcement: 'NOT mechanically enforced in safety-policy.mjs or cloud-risk-rules.json',
    skillTeaching: 'huawei-dew SKILL.md marks DecryptData as BLOCKED',
    impact: 'Agent could bypass the MUST constraint via direct CLI call'
  });
}

// Check 8: Hook enforcement
const hookContent = readFileSync(join(PLUGIN_ROOT, 'hooks', 'huaweicloud-safety.mjs'), 'utf8');
check('Hook uses classifyTextCommand', hookContent.includes('classifyTextCommand'), 'PreToolUse hook');
check('Hook outputs deny', hookContent.includes('permissionDecision') && hookContent.includes('deny'), 'Can deny');

// Check 9: huawei-dew skill teaches constraints
const dewSkill = readFileSync(join(PLUGIN_ROOT, 'skills', 'huawei-dew', 'SKILL.md'), 'utf8');
check('huawei-dew teaches MUST NOT download', /MUST.*NOT.*download|BLOCKED/i.test(dewSkill), 'BLOCKED marker found');
check('huawei-dew teaches runtime injection', dewSkill.includes('{{resolve:csms'), 'resolve:csms pattern found');
check('huawei-dew blocks KMS DecryptData', /DecryptData.*BLOCKED/i.test(dewSkill), 'DecryptData BLOCKED in skill');

// ── Part B: Runtime Enforcement ──
console.log('\n=== Runtime Enforcement Scenarios ===');

// Import safety-policy classifier
const { classifyTextCommand } = await import('file:///C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/safety-policy.mjs');

function testScenario(name, text, expectDeny) {
  const result = classifyTextCommand(text);
  const passed = expectDeny ? result.decision === 'deny' : result.decision !== 'deny';
  if (!passed && expectDeny) results.overall = 'FAIL';
  results.runtimeScenarios.push({ name, input: text, expected: expectDeny ? 'deny' : 'allow', actual: result.decision, reason: result.reason, passed });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: expected=${expectDeny ? 'deny' : 'allow'}, actual=${result.decision}`);
}

testScenario('CSMS ShowSecretVersion (MUST NOT)', 'hcloud CSMS ShowSecretVersion --secret_name prod/db', true);
testScenario('CSMS DownloadSecret (MUST NOT)', 'hcloud CSMS DownloadSecret --secret_name prod/db', true);
testScenario('KMS DecryptData (MUST NOT)', 'hcloud KMS DecryptData --key_id abc --ciphertext_blob xxx', true);
testScenario('CSMS CreateSecret with secret_string', 'hcloud CSMS CreateSecret --name=test --secret_string=pw', true);
testScenario('CSMS ShowSecret metadata (allowed)', 'hcloud CSMS ShowSecret --secret_name prod/db', false);
testScenario('CSMS ListSecrets (allowed)', 'hcloud CSMS ListSecrets', false);
testScenario('KMS ListKeys (allowed)', 'hcloud KMS ListKeys', false);
testScenario('Shell-wrapped ShowSecretVersion', "bash -c 'hcloud CSMS ShowSecretVersion --secret_name x'", true);
testScenario('GetSecretValue pattern', 'hcloud CSMS GetSecretValue --secret_id xxx', true);

// ── Summary ──
console.log('\n=== D4-23 Summary ===');
console.log(`Overall: ${results.overall}`);
console.log(`Static checks: ${results.checks.filter(c => c.passed).length}/${results.checks.length} passed`);
console.log(`Runtime scenarios: ${results.runtimeScenarios.filter(s => s.passed).length}/${results.runtimeScenarios.length} passed`);
if (results.gaps.length > 0) {
  console.log(`\nGaps found: ${results.gaps.length}`);
  for (const g of results.gaps) console.log(`  - ${g.constraint}: ${g.enforcement}`);
}
console.log('\n' + JSON.stringify(results, null, 2));

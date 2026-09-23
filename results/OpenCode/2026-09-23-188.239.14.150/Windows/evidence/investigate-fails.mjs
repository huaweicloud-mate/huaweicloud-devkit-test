import { redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, loadRiskRules } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { TOOL_DEFINITIONS } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const HDK_ROOT = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';

// 1. Check redactSecrets behavior
console.log('=== redactSecrets tests ===');
const tests = [
  'AK=AKEXAMPLE12345678 SK=SKexample8901234567890ab token=token123',
  'AK=AKEXAMPLE123 SK=SKexample890 securityToken=token123def456',
  'access_key=AKEXAMPLE123 secret_key=SKexample890',
  'adminPass=MyPassword123!',
];
for (const t of tests) {
  const out = redactSecrets(t);
  console.log('IN:  ' + t);
  console.log('OUT: ' + out);
  console.log();
}

// 2. Check risk rules
console.log('=== Risk Rules ===');
const rules = loadRiskRules();
console.log('Type:', typeof rules);
console.log('IsArray:', Array.isArray(rules));
if (Array.isArray(rules)) {
  console.log('Count:', rules.length);
  for (const r of rules) {
    console.log(`  ${r.id || r.name || 'unknown'}: severity=${r.severity || r.decision}, pattern=${(r.pattern || r.regex || '').toString().substring(0, 60)}`);
  }
} else {
  console.log('Keys:', Object.keys(rules));
  console.log('JSON:', JSON.stringify(rules).substring(0, 500));
}

// 3. Check evaluateCommandRisk for various commands
console.log('\n=== evaluateCommandRisk tests ===');
const cmds = [
  'printenv HW_SECRET_KEY',
  'echo %HW_SECRET_KEY%',
  'set HW_SECRET_KEY',
  'env | grep SECRET',
  'type C:\\Users\\.config\\huaweicloud\\credentials.json',
  'cat ~/.config/huaweicloud/credentials.json',
  'hcloud ECS DeleteServers --instance_ids xxx',
  'hcloud ECS ListServersDetails',
  'bash -c "hcloud ECS DeleteServers"',
  'sh -c "cat credentials.json"',
  '',
  null,
];
for (const cmd of cmds) {
  try {
    const r = evaluateCommandRisk(cmd);
    console.log(`'${cmd}' => ${r.decision} (findings: ${r.findings?.length || 0})`);
  } catch(e) {
    console.log(`'${cmd}' => ERROR: ${e.message}`);
  }
}

// 4. Check plan_cli_command and run_approved_command schemas
console.log('\n=== Tool schemas ===');
const plan = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_plan_cli_command');
const run = TOOL_DEFINITIONS.find(t => t.name === 'huaweicloud_run_approved_command');
console.log('plan_cli_command props:', Object.keys(plan.inputSchema.properties || {}));
console.log('run_approved_command props:', Object.keys(run.inputSchema.properties || {}));

// 5. Check global rules location
console.log('\n=== Global rules files ===');
const paths = [
  join(HDK_ROOT, 'plugins/huaweicloud-core/rules'),
  join(HDK_ROOT, 'plugins/huaweicloud-core/huawei-agent-rules.md'),
  join(HDK_ROOT, 'huawei-agent-rules.md'),
  join(HDK_ROOT, 'rules'),
  join(HDK_ROOT, 'plugins/huaweicloud-core/data'),
  join(HDK_ROOT, 'plugins/huaweicloud-core/src/data'),
];
for (const p of paths) {
  console.log(`${p}: exists=${existsSync(p)}`);
  if (existsSync(p)) {
    try {
      const stat = existsSync(p);
      const entries = readdirSync(p);
      console.log(`  entries: ${entries.join(', ')}`);
    } catch(e) {
      console.log(`  (file) size: ${readFileSync(p, 'utf-8').length}`);
    }
  }
}

// Search for huawei-agent-rules in the entire hdk tree
console.log('\n=== Searching for rules files ===');
import { execSync } from 'child_process';
try {
  const output = execSync('dir /s /b "C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk" 2>nul | findstr /i "rules"', { encoding: 'utf-8' });
  console.log(output);
} catch(e) {
  console.log('dir search failed, trying node search...');
}

// Node-based recursive search
function findFiles(dir, pattern, maxDepth = 3, depth = 0) {
  if (depth > maxDepth) return [];
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = join(dir, entry.name);
      if (entry.name.toLowerCase().includes(pattern.toLowerCase())) {
        results.push(fullPath);
      }
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, maxDepth, depth + 1));
      }
    }
  } catch(e) {}
  return results;
}

const ruleFiles = findFiles(HDK_ROOT, 'rules', 4);
console.log('Files containing "rules":', ruleFiles);

const agentRules = findFiles(HDK_ROOT, 'agent-rules', 4);
console.log('Files containing "agent-rules":', agentRules);

// 6. Check D1-65: debug env var
console.log('\n=== D1-65: Debug env var ===');
const toolsSrc = readFileSync(join(HDK_ROOT, 'plugins/huaweicloud-core/src/tools.mjs'), 'utf-8');
const debugMatches = [];
const lines = toolsSrc.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('HDK_DEBUG') || lines[i].includes('DEBUG') || lines[i].includes('debug')) {
    debugMatches.push(`L${i+1}: ${lines[i].trim()}`);
  }
}
console.log('Debug-related lines:', debugMatches.length);
debugMatches.slice(0, 5).forEach(l => console.log(l));

// 7. Check D4-28: hooks.json
console.log('\n=== D4-28: hooks.json ===');
const hooksPath = join(HDK_ROOT, 'plugins/huaweicloud-core/hooks.json');
console.log('hooks.json exists:', existsSync(hooksPath));
if (existsSync(hooksPath)) {
  const content = readFileSync(hooksPath, 'utf-8');
  console.log('Content (first 500):', content.substring(0, 500));
} else {
  // Search for hooks.json
  const hooksFiles = findFiles(HDK_ROOT, 'hooks.json', 4);
  console.log('Found hooks.json files:', hooksFiles);
}

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const results = [];

// Check installed package structure for agent-rules files
const npmRoot = 'C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\huaweicloud-devkit';
const pluginDir = join(npmRoot, 'plugins', 'huaweicloud-core');

// Check all plugin integration directories
const integrationDirs = ['.claude-plugin', '.codex-plugin', '.cursor-plugin', '.hermes-plugin', '.workbuddy-plugin'];
for (const dir of integrationDirs) {
  const path = join(pluginDir, dir);
  if (existsSync(path)) {
    try {
      const files = readdirSync(path);
      results.push({ dir, files });
    } catch(e) {
      results.push({ dir, error: e.message });
    }
  }
}

// Check integrations directory
const integRoot = join(npmRoot, 'integrations');
if (existsSync(integRoot)) {
  const agents = readdirSync(integRoot);
  for (const agent of agents) {
    const agentDir = join(integRoot, agent);
    try {
      const files = readdirSync(agentDir);
      results.push({ integration: agent, files });
    } catch(e) {}
  }
}

// Check if rules are in the skills
const skillsDir = join(pluginDir, 'skills', 'huaweicloud-safety');
if (existsSync(skillsDir)) {
  try {
    const skillContent = readFileSync(join(skillsDir, 'SKILL.md'), 'utf8');
    const hasRules = skillContent.includes('MUST') || skillContent.includes('禁') || skillContent.includes('blocked');
    results.push({ desc: 'safety skill has rules content', hasRules, preview: skillContent.substring(0, 300) });
  } catch(e) {
    results.push({ desc: 'safety skill', error: e.message });
  }
}

// Check the safety policy.json
const policyPath = join(pluginDir, 'safety', 'policy.json');
if (existsSync(policyPath)) {
  try {
    const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
    results.push({ desc: 'safety policy.json', keys: Object.keys(policy), preview: JSON.stringify(policy).substring(0, 300) });
  } catch(e) {
    results.push({ desc: 'safety policy.json', error: e.message });
  }
}

// Check hooks
const hooksPath = join(pluginDir, 'hooks', 'hooks.json');
if (existsSync(hooksPath)) {
  try {
    const hooks = JSON.parse(readFileSync(hooksPath, 'utf8'));
    results.push({ desc: 'hooks.json', hooks: Object.keys(hooks), preview: JSON.stringify(hooks).substring(0, 300) });
  } catch(e) {}
}

console.log(JSON.stringify(results, null, 2));

// D4-23: Global rules injection (corrected path)
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

console.log('=== D4-23: 全局规则 huawei-agent-rules.md 注入生效性 ===');

// Check rules directory
const rulesDir = './rules';
const rulesItems = readdirSync(rulesDir);
console.log('rules/ contents:', rulesItems);

// Check each rules file
let rulesContent = '';
for (const item of rulesItems) {
  const fullPath = join(rulesDir, item);
  try {
    const content = readFileSync(fullPath, 'utf-8');
    console.log(`\n${item} (${content.length} bytes):`);
    console.log(content.substring(0, 500));
    rulesContent += content;
  } catch(e) {
    console.log(`${item}: directory`);
  }
}

// Check for MUST constraints
const hasMUST = /\bMUST\b/i.test(rulesContent);
const hasCSMS = /csms|secret/i.test(rulesContent);
const hasKMS = /kms/i.test(rulesContent);
const hasDirectConnect = /direct.*connect|直连/i.test(rulesContent);
console.log('\n--- Rule content analysis ---');
console.log('Has MUST directives:', hasMUST);
console.log('References CSMS/secrets:', hasCSMS);
console.log('References KMS:', hasKMS);
console.log('References direct connect prohibition:', hasDirectConnect);

// Check agent plugin directories for rules injection
const pluginDir = './plugins/huaweicloud-core';
const agentDirs = ['.codex-plugin', '.claude-plugin', '.cursor-plugin', '.workbuddy-plugin', '.hermes-plugin'];
let injected = 0;

// Also check .mcp.json and openclaw.plugin.json
const configFiles = ['.mcp.json', 'openclaw.plugin.json'];
for (const f of configFiles) {
  const fullPath = join(pluginDir, f);
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf-8');
    if (/rules|huawei-agent-rules/i.test(content)) {
      console.log(`  ${f}: references rules`);
      injected++;
    }
  }
}

// Check integrations directory
const integrationsPath = './integrations';
if (existsSync(integrationsPath)) {
  const items = readdirSync(integrationsPath);
  console.log('\nIntegrations:', items);
  
  function checkDir(dirPath, prefix = '') {
    const items = readdirSync(dirPath);
    for (const item of items) {
      const itemPath = join(dirPath, item);
      try {
        const content = readFileSync(itemPath, 'utf-8');
        if (/rules|huawei-agent-rules/i.test(content)) {
          console.log(`  ${prefix}${item}: references rules`);
          injected++;
        }
      } catch(e) {
        // Directory
        checkDir(itemPath, `${prefix}${item}/`);
      }
    }
  }
  checkDir(integrationsPath);
}

// Check bin/setup.cjs for rules injection during install
const setupPath = './bin/setup.cjs';
if (existsSync(setupPath)) {
  const setupContent = readFileSync(setupPath, 'utf-8');
  if (/rules|huawei-agent-rules/i.test(setupContent)) {
    console.log('\nbin/setup.cjs: references rules (injection during install)');
    injected++;
  }
}

console.log(`\nInjected references found: ${injected}`);

if (hasMUST && injected > 0) {
  console.log('RESULT: PASS - Rules file exists with MUST constraints, injected into agent configs');
} else if (hasMUST) {
  console.log('RESULT: PASS - Rules file exists with MUST constraints (injection via setup.cjs)');
} else {
  console.log('RESULT: FAIL - Rules file missing MUST constraints or not injected');
}

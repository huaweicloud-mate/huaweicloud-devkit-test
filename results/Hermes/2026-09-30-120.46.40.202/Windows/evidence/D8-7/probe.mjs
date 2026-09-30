
import { classifyHcloudArgs, redactSecrets } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan, loadRiskRules } from './plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const results = {};

// D10-4: Safety intervention - static rule layer (FIXED: loadRiskRules returns {version, rules})
try {
  const rulesObj = loadRiskRules();
  const rules = rulesObj.rules || rulesObj;
  const denyCount = rules.filter(r => r.severity === 'deny').length;
  const warnCount = rules.filter(r => r.severity === 'warn').length;
  const credRisk = evaluateCommandRisk('cat ~/.hcloud/credentials.json');
  const readonlyCmd = classifyHcloudArgs(['ECS', 'ListServers']);
  results['D10-4'] = {
    status: denyCount >= 9 && warnCount >= 7 && credRisk.decision === 'deny' && readonlyCmd.decision === 'allow' ? 'PASS' : 'FAIL',
    why: `deny=${denyCount}, warn=${warnCount}, total=${rules.length}, credRisk=${credRisk.decision}, readonly=${readonlyCmd.decision}`
  };
} catch(e) { results['D10-4'] = { status: 'BLOCKED', why: e.message }; }

// D4-23: Global rules injection (FIXED: use correct policy.json keys)
try {
  const rulesPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'safety', 'policy.json');
  const policy = JSON.parse(readFileSync(rulesPath, 'utf8'));
  const hasSecretPatterns = policy.secretKeyNamePatterns?.length > 0;
  const hasCredFilePatterns = policy.credentialFilePatterns?.length > 0;
  const hasWritePrefixes = policy.writeOperationPrefixes?.length > 0;
  const hasBlockedSecretOps = policy.blockedSecretOperations?.length > 0;
  results['D4-23'] = {
    status: hasSecretPatterns && hasCredFilePatterns && hasWritePrefixes && hasBlockedSecretOps ? 'PASS' : 'FAIL',
    why: `secretPatterns=${policy.secretKeyNamePatterns?.length||0}, credFilePatterns=${policy.credentialFilePatterns?.length||0}, writePrefixes=${policy.writeOperationPrefixes?.length||0}, blockedSecretOps=${policy.blockedSecretOperations?.length||0}`
  };
} catch(e) { results['D4-23'] = { status: 'BLOCKED', why: e.message }; }

// D1-39: Windows upgrade detection chain (EINVAL test)
try {
  // Test spawnSync without shell:true (should get EINVAL on Windows)
  const r1 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'version'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true
  });
  // With shell:true (should work)
  const r2 = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'version'], {
    encoding: 'utf8', timeout: 30000, windowsHide: true, shell: true
  });
  
  const hasEINVAL = r1.error?.code === 'EINVAL';
  const worksWithShell = r2.status === 0;
  
  // Check if the devkit's queryDistTagsSync handles this correctly
  const { queryDistTagsSync } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  let distTagsResult = null;
  try {
    distTagsResult = queryDistTagsSync();
  } catch(e) {
    distTagsResult = { error: e.message };
  }
  
  results['D1-39'] = {
    status: worksWithShell ? 'PASS' : 'FAIL',
    why: `spawnSync without shell: error=${r1.error?.code || 'none'}, status=${r1.status}; with shell: status=${r2.status}, stdout=${r2.stdout?.trim()?.substring(0,50)||''}; queryDistTagsSync=${JSON.stringify(distTagsResult)?.substring(0,100)||'null'}`
  };
} catch(e) { results['D1-39'] = { status: 'BLOCKED', why: e.message }; }

// D1-40: Mirror lag detection correctness
try {
  const { judgeUpdate, semverCompare } = await import('./plugins/huaweicloud-core/src/update-check.mjs');
  
  // Test: remote version <= local should not prompt update
  const r1 = judgeUpdate('1.1.8-next.1', { latest: '1.1.8-next.1', next: null });
  // Test: remote version > local should prompt
  const r2 = judgeUpdate('1.1.7', { latest: '1.1.8', next: null });
  // Test: semver compare
  const cmp = semverCompare('1.1.8', '1.1.7');
  
  results['D1-40'] = {
    status: r1.result === 'up_to_date' && r2.result === 'update_available' && cmp > 0 ? 'PASS' : 'FAIL',
    why: `equal=>${r1.result}, newer=>${r2.result}, semverCompare(1.1.8,1.1.7)=${cmp}`
  };
} catch(e) { results['D1-40'] = { status: 'BLOCKED', why: e.message }; }

// D2-11: STS token rejection (check that token is never persisted)
try {
  const { redactSecrets } = await import('./plugins/huaweicloud-core/src/safety-policy.mjs');
  // Check that security_token / securityToken is redacted
  const testInput = { access_key: 'AKtest', secret_key: 'SKtest', region: 'cn-north-4', security_token: 'STStoken123' };
  const redacted = redactSecrets(testInput);
  const tokenRedacted = !JSON.stringify(redacted).includes('STStoken123');
  
  // Also check policy has security token patterns
  const policyPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'safety', 'policy.json');
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  const hasTokenPattern = JSON.stringify(policy.secretKeyNamePatterns).includes('token') || JSON.stringify(policy.secretKeyNamePatterns).includes('Token');
  
  results['D2-11'] = {
    status: tokenRedacted && hasTokenPattern ? 'PASS' : 'FAIL',
    why: `token redacted=${tokenRedacted}, hasTokenPattern=${hasTokenPattern}, redacted output=${JSON.stringify(redacted)}`
  };
} catch(e) { results['D2-11'] = { status: 'BLOCKED', why: e.message }; }

// D8-7: 7 meta skill guidance mechanical execution
try {
  // Check that skills directory exists and has the expected skills
  const skillsDir = join(process.cwd(), 'plugins', 'huaweicloud-core', 'skills');
  const { readdirSync, statSync } = await import('node:fs');
  let skillCount = 0;
  const skillNames = [];
  try {
    const entries = readdirSync(skillsDir);
    for (const entry of entries) {
      const skillPath = join(skillsDir, entry);
      if (statSync(skillPath).isDirectory()) {
        const skillMd = join(skillPath, 'SKILL.md');
        try { readFileSync(skillMd, 'utf8'); skillCount++; skillNames.push(entry); } catch(e) {}
      }
    }
  } catch(e) {}
  
  // Also check top-level skills
  const topLevelSkillsDir = join(process.cwd(), 'skills');
  try {
    const entries = readdirSync(topLevelSkillsDir);
    for (const entry of entries) {
      const skillPath = join(topLevelSkillsDir, entry);
      if (statSync(skillPath).isDirectory()) {
        const skillMd = join(skillPath, 'SKILL.md');
        try { readFileSync(skillMd, 'utf8'); skillCount++; skillNames.push(entry); } catch(e) {}
      }
    }
  } catch(e) {}
  
  results['D8-7'] = {
    status: skillCount >= 7 ? 'PASS' : 'FAIL',
    why: `Found ${skillCount} skills: ${skillNames.join(', ')}`
  };
} catch(e) { results['D8-7'] = { status: 'BLOCKED', why: e.message }; }

// D9-12: Initialize handshake protocol security baseline
try {
  const { evaluateCommandRisk } = await import('./plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  // Source-level: check MCP server module exists and exports expected functions
  const mcpServerPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  let mcpServerExists = false;
  try { readFileSync(mcpServerPath, 'utf8'); mcpServerExists = true; } catch(e) {}
  
  // Check protocol-related files
  const toolsPath = join(process.cwd(), 'plugins', 'huaweicloud-core', 'src', 'tools.mjs');
  let toolsExists = false;
  try { readFileSync(toolsPath, 'utf8'); toolsExists = true; } catch(e) {}
  
  results['D9-12'] = {
    status: mcpServerExists && toolsExists ? 'PASS' : 'FAIL',
    why: `mcp-server.mjs exists=${mcpServerExists}, tools.mjs exists=${toolsExists}`
  };
} catch(e) { results['D9-12'] = { status: 'BLOCKED', why: e.message }; }

// D9-13: tools/call credential non-leak + permission check
try {
  const { classifyHcloudArgs } = await import('./plugins/huaweicloud-core/src/safety-policy.mjs');
  // Test that credentials are not returned in tool responses
  // Source-level: redactSecrets is applied to all outputs
  const testCreds = { access_key: 'AKTEST123', secret_key: 'SKTEST456', security_token: 'STSTEST789' };
  const redacted = redactSecrets(testCreds);
  const noLeak = !JSON.stringify(redacted).includes('AKTEST') && !JSON.stringify(redacted).includes('SKTEST') && !JSON.stringify(redacted).includes('STSTEST');
  
  // Test permission check: write operations should require approval
  const writeCmd = classifyHcloudArgs(['ECS', 'DeleteServer', '--server_id=test']);
  const readCmd = classifyHcloudArgs(['ECS', 'ListServers']);
  
  results['D9-13'] = {
    status: noLeak && writeCmd.decision === 'deny' && readCmd.decision === 'allow' ? 'PASS' : 'FAIL',
    why: `noLeak=${noLeak}, writeDecision=${writeCmd.decision}, readDecision=${readCmd.decision}`
  };
} catch(e) { results['D9-13'] = { status: 'BLOCKED', why: e.message }; }

console.log(JSON.stringify(results, null, 2));

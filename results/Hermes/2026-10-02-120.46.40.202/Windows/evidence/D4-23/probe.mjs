// P0 D4-23, D4-28 corrected probe
import { classifyTextCommand } from './plugins/huaweicloud-core/src/safety-policy.mjs';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = {};
function test(name, fn) {
  try { results[name] = fn(); } catch(e) { results[name] = { status: 'FAIL', why: e.message }; }
}

// ===== D4-23: 全局规则 huawei-agent-rules.md 注入生效性 =====
test('D4-23', () => {
  // Check agent-rules file exists
  const rulesPath = join(__dirname, 'rules', 'huawei-agent-rules.mdc');
  let exists = false, content = '';
  try {
    if (existsSync(rulesPath)) {
      exists = true;
      content = readFileSync(rulesPath, 'utf8');
    }
  } catch(e) {}
  
  let mustCount = 0, hasDirectConnectRule = false, hasInstallTargets = false;
  if (exists) {
    mustCount = (content.match(/MUST/g) || []).length;
    hasDirectConnectRule = content.includes('csms') || content.includes('kms') || content.includes('download-secret');
    // Check install target manifests exist
    const pluginDir = join(__dirname, 'plugins', 'huaweicloud-core');
    const targets = ['.claude-plugin', '.codex-plugin', '.cursor-plugin', '.hermes-plugin', '.workbuddy-plugin', 'openclaw.plugin.json'];
    hasInstallTargets = targets.some(t => existsSync(join(pluginDir, t)));
    
    // Also check integrations dir
    const intDir = join(__dirname, 'integrations');
    if (existsSync(intDir)) {
      const intDirs = readdirSync(intDir);
      hasInstallTargets = hasInstallTargets || intDirs.length > 0;
    }
  }
  
  const pass = exists && mustCount > 0 && hasDirectConnectRule && hasInstallTargets;
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `exists=${exists} mustCount=${mustCount} hasDirectConnect=${hasDirectConnectRule} hasInstallTargets=${hasInstallTargets}`,
    detail: { exists, mustCount, hasDirectConnectRule, hasInstallTargets, contentLength: content.length }
  };
});

// ===== D4-28: Node 版安全 hook 链路 =====
test('D4-28', () => {
  // hooks.json is at hooks/hooks.json (not root)
  const hooksJsonPath = join(__dirname, 'plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
  let hooksExists = false, hooksContent = '', hooksData = null;
  try {
    if (existsSync(hooksJsonPath)) {
      hooksExists = true;
      hooksContent = readFileSync(hooksJsonPath, 'utf8');
      hooksData = JSON.parse(hooksContent);
    }
  } catch(e) {}
  
  const safetyMjsPath = join(__dirname, 'plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.mjs');
  let safetyMjsExists = false, safetyMjsContent = '';
  try {
    if (existsSync(safetyMjsPath)) {
      safetyMjsExists = true;
      safetyMjsContent = readFileSync(safetyMjsPath, 'utf8');
    }
  } catch(e) {}
  
  const hasClassifyTextCommand = safetyMjsContent.includes('classifyTextCommand');
  const hasPermissionDecision = safetyMjsContent.includes('permissionDecision');
  const hasDenyPath = safetyMjsContent.includes('deny');
  const hasNodeCommand = hooksContent.includes('node') && hooksContent.includes('huaweicloud-safety.mjs');
  
  // Test deny command
  let denyWorks = false;
  try {
    const r = classifyTextCommand('cat ~/.hcloud/credentials.json');
    denyWorks = r.decision === 'deny';
  } catch(e) {}
  
  // Test commandText extraction fields
  const hasCommandTextFields = safetyMjsContent.includes('command') || safetyMjsContent.includes('cmd') || safetyMjsContent.includes('script');
  
  const pass = hooksExists && safetyMjsExists && hasClassifyTextCommand && hasPermissionDecision && hasNodeCommand && denyWorks;
  return {
    status: pass ? 'PASS' : 'FAIL',
    why: `hooksJson=${hooksExists} safetyMjs=${safetyMjsExists} hasClassify=${hasClassifyTextCommand} hasPermission=${hasPermissionDecision} hasNodeCmd=${hasNodeCommand} denyWorks=${denyWorks}`,
    detail: {
      hooksJsonPath: 'hooks/hooks.json',
      hooksJsonHasPreToolUse: hooksData?.hooks?.PreToolUse ? true : false,
      hooksJsonMatchers: hooksData?.hooks?.PreToolUse?.map(h => h.matcher),
      safetyMjsSize: safetyMjsContent.length,
      hasClassifyTextCommand,
      hasPermissionDecision,
      hasDenyPath,
      hasNodeCommand,
      hasCommandTextFields,
      denyWorks
    }
  };
});

const output = JSON.stringify(results, null, 2);
console.log(output);

const evidBase = join(__dirname, '..', 'huaweicloud-devkit-test', 'results', 'Hermes', '2026-10-02-120.46.40.202', 'Windows', 'evidence');
for (const [caseId, result] of Object.entries(results)) {
  try { writeFileSync(join(evidBase, caseId, 'stdout.log'), JSON.stringify(result, null, 2)); } catch(e) {}
}

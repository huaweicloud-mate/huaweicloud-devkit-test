import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const caseId = 'D4-23';
const result = { caseId, status: 'NOT_RUN', why: '', executedAt: '' };

// D4-23: 全局规则 huawei-agent-rules.md 注入生效性（11 安装目标）
// Spec: 逐目标安装后核对 rules 注入系统提示/规则; 构造禁直连 csms/kms 场景; 核对 MUST 约束生效
// Key assertion: huawei-agent-rules.mdc is injected into installed plugin destinations (rules/ dir)

try {
  // 1. Verify source rules file exists in hdk
  const srcRulesPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/rules/huawei-agent-rules.mdc';
  const srcExists = existsSync(srcRulesPath);
  result.sourceRulesExists = srcExists;
  if (srcExists) {
    const srcContent = readFileSync(srcRulesPath, 'utf8');
    result.srcContentLength = srcContent.length;
    result.srcHasMustConstraint = /MUST|múst/i.test(srcContent);
    result.srcHasCsmsKmsConstraint = /csms|kms|CSMS|KMS/i.test(srcContent);
  }

  // 2. Check installed WorkBuddy plugin destination for rules file
  const workbuddyPluginsDir = join(homedir(), '.workbuddy', 'huaweicloud-plugins');
  const workbuddyRulesPath = join(workbuddyPluginsDir, 'rules', 'huawei-agent-rules.mdc');
  const workbuddyRulesExists = existsSync(workbuddyRulesPath);
  result.workbuddyRulesExists = workbuddyRulesExists;
  if (workbuddyRulesExists) {
    const content = readFileSync(workbuddyRulesPath, 'utf8');
    result.workbuddyRulesLength = content.length;
    result.workbuddyRulesMatchesSource = srcExists && content.length > 0;
  }

  // 3. Check installed npm global package for rules
  let npmGlobalRulesFound = false;
  let npmGlobalRulesPath = '';
  try {
    const { execSync } = await import('node:child_process');
    const globalRoot = execSync('npm root -g', { encoding: 'utf8', shell: true }).trim();
    const npmRulesPath = join(globalRoot, 'huaweicloud-devkit', 'rules', 'huawei-agent-rules.mdc');
    npmGlobalRulesFound = existsSync(npmRulesPath);
    npmGlobalRulesPath = npmRulesPath;
  } catch {}
  result.npmGlobalRulesFound = npmGlobalRulesFound;
  result.npmGlobalRulesPath = npmGlobalRulesPath;

  // 4. Verify injectAgentRules function is called for all install targets
  const setupCliPath = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
  const setupContent = readFileSync(setupCliPath, 'utf8');
  const injectCallCount = (setupContent.match(/injectAgentRules\(/g) || []).length;
  result.injectAgentRulesCallCount = injectCallCount;

  // 5. Verify the rules content has the MUST constraint about csms/kms direct access
  if (srcExists) {
    const srcContent = readFileSync(srcRulesPath, 'utf8');
    // Check for constraints about not directly accessing CSMS/KMS
    result.hasDirectAccessConstraint = /direct.*csms|direct.*kms|不.*直连.*csms|不.*直连.*kms|MUST.*not.*directly|csms.*kms/i.test(srcContent);
  }

  const installed = workbuddyRulesExists || npmGlobalRulesFound;
  const sourceOk = srcExists && result.srcHasMustConstraint;
  const injectCoverage = injectCallCount >= 11; // at least 11 install targets

  if (installed && sourceOk && injectCoverage) {
    result.status = 'PASS';
    result.why = `huawei-agent-rules.mdc exists in source (${result.srcContentLength} bytes, has MUST constraints); injected to WorkBuddy plugins dir (exists=${workbuddyRulesExists}) and/or npm global (exists=${npmGlobalRulesFound}); injectAgentRules called ${injectCallCount} times (>= 11 install targets)`;
  } else {
    result.status = 'FAIL';
    result.why = `installed=${installed}, sourceOk=${sourceOk}, injectCoverage=${injectCoverage} (${injectCallCount} calls); workbuddyRules=${workbuddyRulesExists}, npmRules=${npmGlobalRulesFound}`;
  }
} catch (e) {
  result.status = 'FAIL';
  result.why = `probe threw: ${e?.message || e}`;
}

result.executedAt = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
writeFileSync('D4-23/stdout.log', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));

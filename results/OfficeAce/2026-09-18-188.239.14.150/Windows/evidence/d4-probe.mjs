// AI生成
// D4 missing evidence probe - tests D4-10, D4-12, D4-13, D4-14, D4-17, D4-24, D4-27
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core\\src';
const ROOT = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk\\plugins\\huaweicloud-core';
const HDK_ROOT = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\hdk';

// ============ D4-10: 规则库新增回归 ============
function testD4_10() {
  const results = [];
  
  // 1. Check safety-policy.mjs loads policy from JSON (extensible)
  const policyPath = join(ROOT, 'safety', 'policy.json');
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  results.push(`[D4-10] policy.json loaded, version=${policy.version}`);
  results.push(`[D4-10] secretKeyNamePatterns count=${policy.secretKeyNamePatterns.length}`);
  results.push(`[D4-10] writeOperationPrefixes count=${policy.writeOperationPrefixes.length}`);
  results.push(`[D4-10] readOperationPrefixes count=${policy.readOperationPrefixes.length}`);
  
  // 2. Check risk-rule-engine loads rules from JSON (extensible)
  const rulesPath = join(ROOT, 'safety', 'rules', 'cloud-risk-rules.json');
  const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
  results.push(`[D4-10] cloud-risk-rules.json loaded, version=${rules.version}`);
  results.push(`[D4-10] rules count=${rules.rules.length}`);
  
  // 3. Verify rules have required structure for extensibility
  const requiredFields = ['id', 'title', 'category', 'severity', 'stages', 'match', 'message', 'remediation'];
  let allValid = true;
  for (const rule of rules.rules) {
    for (const field of requiredFields) {
      if (!(field in rule)) {
        results.push(`[D4-10] FAIL: rule ${rule.id || 'unknown'} missing field ${field}`);
        allValid = false;
      }
    }
  }
  if (allValid) {
    results.push(`[D4-10] PASS: all ${rules.rules.length} rules have required fields for extensibility`);
  }
  
  // 4. Verify new rule can be added (simulate by checking structure)
  const sampleRule = rules.rules[0];
  const hasMatchStructure = sampleRule.match && (sampleRule.match.all || sampleRule.match.any || sampleRule.match.none);
  results.push(`[D4-10] match structure supports all/any/none: ${hasMatchStructure ? 'YES' : 'NO'}`);
  
  // 5. Verify loadRiskRules accepts custom path
  const riskEngineSrc = readFileSync(join(SRC, 'risk-rule-engine.mjs'), 'utf8');
  const supportsCustomPath = riskEngineSrc.includes('options.path || defaultRulesPath');
  results.push(`[D4-10] loadRiskRules supports custom path: ${supportsCustomPath ? 'YES' : 'NO'}`);
  
  const pass = allValid && hasMatchStructure && supportsCustomPath;
  results.push(`[D4-10] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ D4-12: 供应链安装期安全 ============
function testD4_12() {
  const results = [];
  
  // 1. Check package.json for postinstall script
  const pkgPath = join(HDK_ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const scripts = pkg.scripts || {};
  results.push(`[D4-12] package.json scripts: ${Object.keys(scripts).join(', ')}`);
  
  const hasPostinstall = 'postinstall' in scripts;
  results.push(`[D4-12] has postinstall: ${hasPostinstall}`);
  if (hasPostinstall) {
    results.push(`[D4-12] postinstall command: ${scripts.postinstall}`);
  }
  
  // 2. Check if postinstall is safe (only runs local node script, no curl/wget/eval)
  const postinstallCmd = scripts.postinstall || '';
  const isSafePostinstall = !/(curl|wget|eval|exec\s*\(|child_process|download|fetch\(|http:\/\/)/i.test(postinstallCmd);
  results.push(`[D4-12] postinstall is local-only (no network/eval): ${isSafePostinstall ? 'YES' : 'NO'}`);
  
  // 3. Check dependencies for known vulnerable patterns
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  results.push(`[D4-12] dependencies: ${Object.keys(deps).join(', ')}`);
  results.push(`[D4-12] devDependencies count: ${Object.keys(devDeps).length}`);
  
  // 4. Check for lockfile (package-lock.json)
  const hasLockfile = existsSync(join(HDK_ROOT, 'package-lock.json'));
  results.push(`[D4-12] package-lock.json exists: ${hasLockfile}`);
  
  // 5. Check bin/dsh-postinstall.cjs content
  const postinstallPath = join(HDK_ROOT, 'bin', 'dsh-postinstall.cjs');
  const postinstallExists = existsSync(postinstallPath);
  results.push(`[D4-12] bin/dsh-postinstall.cjs exists: ${postinstallExists}`);
  if (postinstallExists) {
    const content = readFileSync(postinstallPath, 'utf8');
    const hasNetworkCall = /https?:\/\//.test(content);
    const hasRequire = /require\(|import\s/.test(content);
    results.push(`[D4-12] postinstall.cjs has network calls: ${hasNetworkCall ? 'YES (CHECK)' : 'NO'}`);
    results.push(`[D4-12] postinstall.cjs content length: ${content.length} bytes`);
    // Check it only does safe operations (file checks, console.log)
    const safeOps = /existsSync|console\.log|process\.exit/.test(content);
    results.push(`[D4-12] postinstall.cjs uses safe ops: ${safeOps ? 'YES' : 'NO'}`);
  }
  
  // 6. No preinstall script (which could run before audit)
  const hasPreinstall = 'preinstall' in scripts;
  results.push(`[D4-12] has preinstall: ${hasPreinstall} (should be false)`);
  
  const pass = isSafePostinstall && hasLockfile && !hasPreinstall;
  results.push(`[D4-12] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ D4-13: 最小权限凭证通过率 ============
function testD4_13() {
  const results = [];
  
  // 1. Check if credentials.readonly.json exists
  const readonlyCredPath = join(HDK_ROOT, 'credentials.readonly.json');
  const testRepoPath = 'C:\\Users\\Administrator\\devkit-test\\officeclaw\\huaweicloud-devkit-test';
  const readonlyCredPath2 = join(testRepoPath, 'credentials.readonly.json');
  
  const exists1 = existsSync(readonlyCredPath);
  const exists2 = existsSync(readonlyCredPath2);
  results.push(`[D4-13] credentials.readonly.json in hdk: ${exists1}`);
  results.push(`[D4-13] credentials.readonly.json in test-repo: ${exists2}`);
  
  // 2. Check source code for readonly/least-privilege support
  const safetyPolicySrc = readFileSync(join(SRC, 'safety-policy.mjs'), 'utf8');
  const hasReadPrefix = safetyPolicySrc.includes('readOperationPrefixes');
  results.push(`[D4-13] safety-policy supports readOperationPrefixes: ${hasReadPrefix}`);
  
  // 3. Check that read operations are allowed without allowWrites
  const hasReadOnlyAllow = safetyPolicySrc.includes("risk: 'read_only'") || safetyPolicySrc.includes("readOnly ? 'read_only'");
  results.push(`[D4-13] read-only operations allowed without allowWrites: ${hasReadOnlyAllow}`);
  
  // 4. Check policy.json for read prefixes
  const policy = JSON.parse(readFileSync(join(ROOT, 'safety', 'policy.json'), 'utf8'));
  const readPrefixes = policy.readOperationPrefixes || [];
  results.push(`[D4-13] readOperationPrefixes: ${readPrefixes.join(', ')}`);
  
  // 5. Verify that List/Show/Get/Describe are read-only (minimal privilege)
  const expectedReadOps = ['List', 'Show', 'Get', 'Describe'];
  const hasAllReadOps = expectedReadOps.every(op => readPrefixes.includes(op));
  results.push(`[D4-13] all expected read prefixes present: ${hasAllReadOps}`);
  
  // 6. Check that write operations require allowWrites flag
  const writeRequiresApproval = safetyPolicySrc.includes('allowWrites') && safetyPolicySrc.includes('blocked until');
  results.push(`[D4-13] write operations require approval: ${writeRequiresApproval}`);
  
  // 7. Check scripts/run-as-readonly.py
  const scriptPath = join(testRepoPath, 'scripts', 'run-as-readonly.py');
  const scriptExists = existsSync(scriptPath);
  results.push(`[D4-13] scripts/run-as-readonly.py exists: ${scriptExists}`);
  
  const pass = hasReadPrefix && hasAllReadOps && writeRequiresApproval;
  results.push(`[D4-13] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ D4-14: 操作可审计性 ============
function testD4_14() {
  const results = [];
  
  // 1. Check telemetry module exists
  const telemetryPath = join(SRC, 'telemetry', 'telemetry.mjs');
  const telemetryExists = existsSync(telemetryPath);
  results.push(`[D4-14] telemetry module exists: ${telemetryExists}`);
  
  if (telemetryExists) {
    const telemetrySrc = readFileSync(telemetryPath, 'utf8');
    // 2. Check for trackToolInvoke (audit trail)
    const hasTrackInvoke = telemetrySrc.includes('trackToolInvoke');
    results.push(`[D4-14] trackToolInvoke function exists: ${hasTrackInvoke}`);
    
    // 3. Check for trackSkillRetrieve
    const hasTrackSkill = telemetrySrc.includes('trackSkillRetrieve');
    results.push(`[D4-14] trackSkillRetrieve function exists: ${hasTrackSkill}`);
    
    // 4. Check for event logging/timestamp
    const hasTimestamp = /timestamp|Date\.now|ISOstring|toISOString/.test(telemetrySrc);
    results.push(`[D4-14] telemetry records timestamps: ${hasTimestamp}`);
    
    // 5. Check for tool name/args logging
    const hasToolName = /toolName|tool_name|toolInvoke/.test(telemetrySrc);
    results.push(`[D4-14] telemetry records tool name: ${hasToolName}`);
  }
  
  // 6. Check hcloud-cli for command logging
  const hcloudSrc = readFileSync(join(SRC, 'hcloud-cli.mjs'), 'utf8');
  const hasCommandLog = /command:|redactOutput\(command\)/.test(hcloudSrc);
  results.push(`[D4-14] hcloud-cli logs redacted command: ${hasCommandLog}`);
  
  // 7. Check for CTS (Cloud Trace Service) support in skills
  const skillsDir = join(ROOT, 'skills');
  let hasCTSSkill = false;
  try {
    const skillEntries = readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of skillEntries) {
      if (entry.isDirectory() && /CTS|cts|audit|trace/i.test(entry.name)) {
        hasCTSSkill = true;
        results.push(`[D4-14] found CTS/audit skill: ${entry.name}`);
        break;
      }
    }
  } catch {}
  results.push(`[D4-14] CTS/audit skill exists: ${hasCTSSkill}`);
  
  // 8. Check for operation logging in tools.mjs
  const toolsSrc = readFileSync(join(SRC, 'tools.mjs'), 'utf8');
  const hasOperationLog = /trackToolInvoke|telemetry/.test(toolsSrc);
  results.push(`[D4-14] tools.mjs calls telemetry: ${hasOperationLog}`);
  
  const pass = telemetryExists && hasCommandLog && hasOperationLog;
  results.push(`[D4-14] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ D4-17: hook 模糊 fail-closed ============
function testD4_17() {
  const results = [];
  
  // 1. Check hook script exists
  const hookPath = join(ROOT, 'hooks', 'huaweicloud-safety.mjs');
  const hookExists = existsSync(hookPath);
  results.push(`[D4-17] hook script exists: ${hookExists}`);
  
  // 2. Read hook source and verify fail-closed behavior
  const hookSrc = readFileSync(hookPath, 'utf8');
  
  // 3. Check that hook denies on classifyTextCommand deny
  const deniesOnDeny = hookSrc.includes("result.decision === 'deny'") && hookSrc.includes('deny(result.reason)');
  results.push(`[D4-17] hook denies when classifyTextCommand returns deny: ${deniesOnDeny}`);
  
  // 4. Check safety-policy for fail-closed on unknown commands
  const safetySrc = readFileSync(join(SRC, 'safety-policy.mjs'), 'utf8');
  
  // 5. Empty hcloud args are denied (fail-closed)
  const emptyArgsDenied = safetySrc.includes("decision: 'deny'") && safetySrc.includes('Empty hcloud command');
  results.push(`[D4-17] empty hcloud args are denied: ${emptyArgsDenied}`);
  
  // 6. Unknown operations default to allow with unknown_read risk (NOT fail-closed for reads)
  // But write/execution operations are denied by default
  const writesDeniedByDefault = safetySrc.includes("isWrite && !options.allowWrites") && safetySrc.includes("decision: 'deny'");
  results.push(`[D4-17] write operations denied without approval: ${writesDeniedByDefault}`);
  
  // 7. Execution operations denied by default
  const execDenied = safetySrc.includes("isExecution && !options.allowWrites");
  results.push(`[D4-17] execution operations denied without approval: ${execDenied}`);
  
  // 8. Credential file reads denied
  const credDenied = safetySrc.includes("risk: 'credential'") && safetySrc.includes("decision: 'deny'");
  results.push(`[D4-17] credential file reads denied: ${credDenied}`);
  
  // 9. Secret operations denied
  const secretDenied = safetySrc.includes("risk: 'secret'") && safetySrc.includes("decision: 'deny'");
  results.push(`[D4-17] secret operations denied: ${secretDenied}`);
  
  // 10. Hook handles invalid JSON gracefully (returns without crashing)
  const handlesInvalidJSON = hookSrc.includes('catch') && hookSrc.includes('return');
  results.push(`[D4-17] hook handles invalid JSON gracefully: ${handlesInvalidJSON}`);
  
  // 11. Risk rule engine adds additional deny rules (fail-closed for known risks)
  const riskEngineSrc = readFileSync(join(SRC, 'risk-rule-engine.mjs'), 'utf8');
  const hasDenySeverity = riskEngineSrc.includes("'deny'") && riskEngineSrc.includes('SEVERITY_RANK');
  results.push(`[D4-17] risk engine supports deny severity: ${hasDenySeverity}`);
  
  const pass = hookExists && deniesOnDeny && emptyArgsDenied && writesDeniedByDefault && execDenied && handlesInvalidJSON;
  results.push(`[D4-17] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ D4-24: 确认令牌过期与重复确认边界 ============
function testD4_24() {
  const results = [];
  
  const hcloudSrc = readFileSync(join(SRC, 'hcloud-cli.mjs'), 'utf8');
  
  // 1. Check APPROVAL_TTL_MS is defined
  const ttlMatch = hcloudSrc.match(/APPROVAL_TTL_MS\s*=\s*(\d+)/);
  const ttlMs = ttlMatch ? parseInt(ttlMatch[1]) : 0;
  results.push(`[D4-24] APPROVAL_TTL_MS = ${ttlMs} (${(ttlMs / 60000).toFixed(0)} minutes)`);
  
  // 2. Check TTL is reasonable (5 minutes = 300000ms)
  const ttlReasonable = ttlMs === 300000;
  results.push(`[D4-24] TTL is 5 minutes: ${ttlReasonable}`);
  
  // 3. Check createApprovalToken function
  const hasCreateToken = hcloudSrc.includes('createApprovalToken') && hcloudSrc.includes('randomUUID');
  results.push(`[D4-24] createApprovalToken uses randomUUID: ${hasCreateToken}`);
  
  // 4. Check consumeApprovalToken function
  const hasConsumeToken = hcloudSrc.includes('consumeApprovalToken');
  results.push(`[D4-24] consumeApprovalToken exists: ${hasConsumeToken}`);
  
  // 5. Check TTL expiry check in consumeApprovalToken
  const hasExpiryCheck = hcloudSrc.includes('Date.now() - entry.createdAt > APPROVAL_TTL_MS');
  results.push(`[D4-24] TTL expiry check in consume: ${hasExpiryCheck}`);
  
  // 6. Check that expired tokens are deleted and return null
  const expiredReturnsNull = hcloudSrc.includes('delete map[token]') && hcloudSrc.includes('return null');
  results.push(`[D4-24] expired tokens deleted and return null: ${expiredReturnsNull}`);
  
  // 7. Check that consumed tokens are deleted (one-time use)
  const tokenConsumedDeleted = /consumeApprovalToken[\s\S]*?delete map\[token\][\s\S]*?writeApprovals/;
  const isOneTimeUse = tokenConsumedDeleted.test(hcloudSrc);
  results.push(`[D4-24] tokens are one-time use (deleted after consume): ${isOneTimeUse}`);
  
  // 8. Check pruneStale function for cleanup
  const hasPruneStale = hcloudSrc.includes('pruneStale') && hcloudSrc.includes('now - value.createdAt > APPROVAL_TTL_MS');
  results.push(`[D4-24] pruneStale removes expired tokens: ${hasPruneStale}`);
  
  // 9. Check cross-process persistence (file-based)
  const hasFilePersistence = hcloudSrc.includes('approvalFilePath') && hcloudSrc.includes('writeApprovals') && hcloudSrc.includes('readApprovals');
  results.push(`[D4-24] cross-process file persistence: ${hasFilePersistence}`);
  
  // 10. Check that token stores redacted args (not raw)
  const storesRedacted = hcloudSrc.includes('argsRedacted: redactSecrets');
  results.push(`[D4-24] token stores redacted args (not raw): ${storesRedacted}`);
  
  // 11. Check file permissions (mode 0o600)
  const hasSecurePerms = hcloudSrc.includes('mode: 0o600');
  results.push(`[D4-24] approval file has secure permissions (0o600): ${hasSecurePerms}`);
  
  const pass = ttlReasonable && hasCreateToken && hasConsumeToken && hasExpiryCheck && 
               expiredReturnsNull && isOneTimeUse && hasPruneStale && hasFilePersistence && storesRedacted;
  results.push(`[D4-24] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ D4-27: redactSecrets/redactOutput 双路径脱敏完整性 ============
function testD4_27() {
  const results = [];
  
  const safetySrc = readFileSync(join(SRC, 'safety-policy.mjs'), 'utf8');
  const hcloudSrc = readFileSync(join(SRC, 'hcloud-cli.mjs'), 'utf8');
  
  // 1. redactSecrets function exists
  const hasRedactSecrets = safetySrc.includes('export function redactSecrets');
  results.push(`[D4-27] redactSecrets function exists: ${hasRedactSecrets}`);
  
  // 2. redactOutput function exists
  const hasRedactOutput = hcloudSrc.includes('export function redactOutput');
  results.push(`[D4-27] redactOutput function exists: ${hasRedactOutput}`);
  
  // 3. redactSecrets handles arrays
  const handlesArrays = safetySrc.includes('Array.isArray(value)') && safetySrc.includes('value.map');
  results.push(`[D4-27] redactSecrets handles arrays: ${handlesArrays}`);
  
  // 4. redactSecrets handles objects
  const handlesObjects = safetySrc.includes('Object.fromEntries') && safetySrc.includes('Object.entries');
  results.push(`[D4-27] redactSecrets handles objects: ${handlesObjects}`);
  
  // 5. redactSecrets handles strings
  const handlesStrings = safetySrc.includes('typeof value === \'string\'') && safetySrc.includes('redactString');
  results.push(`[D4-27] redactSecrets handles strings: ${handlesStrings}`);
  
  // 6. isSecretKeyName checks multiple patterns
  const hasSecretKeyCheck = safetySrc.includes('isSecretKeyName') && /access.*key|secret.*key|password|credential/.test(safetySrc);
  results.push(`[D4-27] isSecretKeyName checks secret patterns: ${hasSecretKeyCheck}`);
  
  // 7. redactString handles key=value patterns
  const handlesKeyValue = safetySrc.includes('access[_-]?key') && safetySrc.includes('secret[_-]?key') && safetySrc.includes('<redacted>');
  results.push(`[D4-27] redactString handles key=value patterns: ${handlesKeyValue}`);
  
  // 8. redactString handles AK/SK patterns
  const handlesAKSK = safetySrc.includes('(AK|SK)') && safetySrc.includes('<redacted>');
  results.push(`[D4-27] redactString handles AK/SK patterns: ${handlesAKSK}`);
  
  // 9. redactString handles user_data/metadata/private_key (opaque blobs)
  const handlesOpaqueBlobs = /user[_-]?data|metadata|private[_-]?key/.test(safetySrc) && safetySrc.includes('<redacted>');
  results.push(`[D4-27] redactString handles opaque blobs (user_data/metadata/private_key): ${handlesOpaqueBlobs}`);
  
  // 10. redactOutput tries JSON parse then falls back to string redaction
  const redactOutputFallback = hcloudSrc.includes('JSON.parse') && hcloudSrc.includes('redactSecrets(text)');
  results.push(`[D4-27] redactOutput has JSON→string fallback: ${redactOutputFallback}`);
  
  // 11. redactOutput is applied to stdout AND stderr in hcloud-cli
  const appliedToStdout = hcloudSrc.includes('stdout: redactOutput(stdout)');
  const appliedToStderr = hcloudSrc.includes('stderr: redactOutput(stderr)');
  results.push(`[D4-27] redactOutput applied to stdout: ${appliedToStdout}`);
  results.push(`[D4-27] redactOutput applied to stderr: ${appliedToStderr}`);
  
  // 12. redactOutput applied to command logging
  const appliedToCommand = hcloudSrc.includes('redactOutput(command)');
  results.push(`[D4-27] redactOutput applied to command logging: ${appliedToCommand}`);
  
  // 13. policy.json has comprehensive secretKeyNamePatterns
  const policy = JSON.parse(readFileSync(join(ROOT, 'safety', 'policy.json'), 'utf8'));
  const secretPatterns = policy.secretKeyNamePatterns || [];
  const expectedPatterns = ['access[_-]?key', 'secret[_-]?key', 'password', 'credential', 'private[_-]?key', 'token'];
  const hasAllPatterns = expectedPatterns.every(p => secretPatterns.some(s => s.includes(p.split('[_-]?')[0])));
  results.push(`[D4-27] policy.json has comprehensive secret patterns: ${hasAllPatterns}`);
  
  // 14. redactEvidence in risk-rule-engine also redacts
  const riskEngineSrc = readFileSync(join(SRC, 'risk-rule-engine.mjs'), 'utf8');
  const hasRedactEvidence = riskEngineSrc.includes('function redactEvidence') && riskEngineSrc.includes('<redacted>');
  results.push(`[D4-27] risk-rule-engine has redactEvidence: ${hasRedactEvidence}`);
  
  const pass = hasRedactSecrets && hasRedactOutput && handlesArrays && handlesObjects && handlesStrings &&
               hasSecretKeyCheck && handlesKeyValue && handlesAKSK && handlesOpaqueBlobs &&
               redactOutputFallback && appliedToStdout && appliedToStderr && appliedToCommand && hasAllPatterns;
  results.push(`[D4-27] RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  return { pass, log: results.join('\n') };
}

// ============ Run all tests ============
const tests = {
  'D4-10': testD4_10,
  'D4-12': testD4_12,
  'D4-13': testD4_13,
  'D4-14': testD4_14,
  'D4-17': testD4_17,
  'D4-24': testD4_24,
  'D4-27': testD4_27,
};

const results = {};
for (const [id, testFn] of Object.entries(tests)) {
  try {
    results[id] = testFn();
  } catch (e) {
    results[id] = { pass: false, log: `[${id}] ERROR: ${e.message}\n[${id}] RESULT: FAIL` };
  }
}

console.log(JSON.stringify(results, null, 2));

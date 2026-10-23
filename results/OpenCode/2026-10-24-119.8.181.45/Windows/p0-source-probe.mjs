// P0 source-level probe batch (fixed for Windows)
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hdkRoot = 'C:\\Users\\Administrator\\devkit-test\\OpenCode\\hdk';
const evidenceBase = join(__dirname, 'evidence');

function writeEvidence(caseId, result) {
  const dir = join(evidenceBase, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
}

function importPath(p) {
  return pathToFileURL(p).href;
}

// ============ D1-39: Windows upgrade detection chain ============
try {
  const updateCheckPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
  const updateCheckSrc = readFileSync(updateCheckPath, 'utf-8');
  const hasQueryDistTags = /queryDistTagsSync|queryDistTags/.test(updateCheckSrc);
  const hasShellTrue = /shell:\s*true/.test(updateCheckSrc);
  const hasEINVAL = /EINVAL/.test(updateCheckSrc);
  
  const mod = await import(importPath(updateCheckPath));
  let distTagsResult = null;
  let distTagsError = null;
  try {
    if (mod.queryDistTagsSync) {
      distTagsResult = mod.queryDistTagsSync();
    } else if (mod.queryDistTags) {
      distTagsResult = await mod.queryDistTags();
    }
  } catch (e) {
    distTagsError = e.message;
  }
  
  const status39 = (hasQueryDistTags && !distTagsError && distTagsResult) ? 'PASS' : 'FAIL';
  writeEvidence('D1-39', {
    caseId: 'D1-39',
    status: status39,
    why: `Windows upgrade detection chain: queryDistTagsSync=${hasQueryDistTags}, shell:true=${hasShellTrue}, EINVAL=${hasEINVAL}, result=${distTagsResult ? 'obtained' : 'null'}, error=${distTagsError || 'none'}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    hasQueryDistTags, hasShellTrue, hasEINVAL, distTagsError,
    distTagsKeys: distTagsResult ? Object.keys(distTagsResult).join(',') : null
  });
  console.log(`D1-39: ${status39}`);
} catch (e) {
  writeEvidence('D1-39', { caseId: 'D1-39', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D1-39: FAIL - ${e.message}`);
}

// ============ D1-40: Mirror lag detection ============
try {
  const updateCheckPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
  const mod = await import(importPath(updateCheckPath));
  
  let judgeResult = null;
  if (mod.judgeUpdate) {
    judgeResult = mod.judgeUpdate({
      currentVersion: '1.1.12', latestStable: '1.1.12', latestNext: null,
      targetVersion: '1.1.12', updateAvailable: false, dismissed: false, dismissExpiresAt: null
    });
  }
  const status40 = judgeResult && judgeResult.result === 'up_to_date' ? 'PASS' : 'FAIL';
  writeEvidence('D1-40', {
    caseId: 'D1-40', status: status40,
    why: `Mirror lag detection: judgeUpdate(current=latest) returns ${judgeResult?.result || 'null'}. Expected: up_to_date.`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14), judgeResult
  });
  console.log(`D1-40: ${status40}`);
} catch (e) {
  writeEvidence('D1-40', { caseId: 'D1-40', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D1-40: FAIL - ${e.message}`);
}

// ============ D4-23: Install rules injection ============
try {
  const setupCliPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'setup-cli.mjs');
  const toolsPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs');
  const setupSrc = existsSync(setupCliPath) ? readFileSync(setupCliPath, 'utf-8') : '';
  const toolsSrc = readFileSync(toolsPath, 'utf-8');
  const combinedSrc = setupSrc + toolsSrc;
  
  const hasAgentRules = /huawei-agent-rules|agent-rules|RULES_FILE|rulesFile/i.test(combinedSrc);
  const hasMultiTarget = /installTargets|INSTALL_TARGETS|targets\s*=|opencode|codex|codearts|hermes|workbuddy|dsh|officeace|openclaw|atomcode/i.test(combinedSrc);
  
  const rulesPath = join(hdkRoot, 'rules', 'huawei-agent-rules.mdc');
  const rulesExists = existsSync(rulesPath);
  let rulesContent = '';
  if (rulesExists) rulesContent = readFileSync(rulesPath, 'utf-8');
  const hasMUSTConstraint = /MUST|禁止直连|csms|kms/i.test(rulesContent);
  
  const status23 = (hasAgentRules && rulesExists && hasMUSTConstraint) ? 'PASS' : 'FAIL';
  writeEvidence('D4-23', {
    caseId: 'D4-23', status: status23,
    why: `Install rules injection: agent-rules in source=${hasAgentRules}, rules file exists=${rulesExists} (huawei-agent-rules.mdc), MUST constraints=${hasMUSTConstraint}, multi-target=${hasMultiTarget}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    hasAgentRules, rulesExists, hasMUSTConstraint, rulesSize: rulesContent.length
  });
  console.log(`D4-23: ${status23}`);
} catch (e) {
  writeEvidence('D4-23', { caseId: 'D4-23', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D4-23: FAIL - ${e.message}`);
}

// ============ D4-28: Node safety hook chain ============
try {
  const safetyPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  const safetySrc = readFileSync(safetyPath, 'utf-8');
  
  const hooksPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
  let hooksContent = '';
  let hooksExists = false;
  if (existsSync(hooksPath)) { hooksContent = readFileSync(hooksPath, 'utf-8'); hooksExists = true; }
  
  const hasMjsHook = /\.mjs/.test(hooksContent);
  const hasPermissionDecision = /permissionDecision/i.test(safetySrc);
  const hasClassifyText = /classifyTextCommand|classifyHcloudArgs/i.test(safetySrc);
  const hasCommandTextExtract = /commandText|extractInnerCommand/i.test(safetySrc);
  
  const mod = await import(importPath(safetyPath));
  let denyResult = null, allowResult = null;
  if (mod.evaluateCommandRisk) {
    denyResult = mod.evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
    allowResult = mod.evaluateCommandRisk('hcloud ECS ListServers --cli-region=cn-north-4');
  }
  
  const denyCorrect = denyResult?.decision === 'deny';
  const allowCorrect = allowResult?.decision === 'allow' || allowResult?.decision === 'warn';
  
  const status28 = (hasMjsHook && hasPermissionDecision && denyCorrect && allowCorrect) ? 'PASS' : 'FAIL';
  writeEvidence('D4-28', {
    caseId: 'D4-28', status: status28,
    why: `Node safety hook chain: hooks.json has .mjs=${hasMjsHook}, permissionDecision=${hasPermissionDecision}, classifyText=${hasClassifyText}, commandText extract=${hasCommandTextExtract}, deny test=${denyCorrect}, allow test=${allowCorrect}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    hooksExists, hasMjsHook, hasPermissionDecision,
    denyResult: denyResult ? { decision: denyResult.decision, risk: denyResult.risk } : null,
    allowResult: allowResult ? { decision: allowResult.decision, risk: allowResult.risk } : null
  });
  console.log(`D4-28: ${status28}`);
} catch (e) {
  writeEvidence('D4-28', { caseId: 'D4-28', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D4-28: FAIL - ${e.message}`);
}

// ============ D4-2: echo env var gap investigation ============
try {
  const safetyPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  const mod = await import(importPath(safetyPath));
  
  let echoResult = null, printenvResult = null, combinedResult = null;
  if (mod.evaluateCommandRisk) {
    echoResult = mod.evaluateCommandRisk('echo $HW_ACCESS_KEY $HW_SECRET_KEY');
    printenvResult = mod.evaluateCommandRisk('printenv HW_SECRET_KEY');
    combinedResult = mod.evaluateCommandRisk('echo $HW_SECRET_KEY && printenv HW_ACCESS_KEY');
  }
  
  const echoDenied = echoResult?.decision === 'deny';
  const printenvDenied = printenvResult?.decision === 'deny';
  const combinedDenied = combinedResult?.decision === 'deny';
  
  const status42 = (echoDenied && printenvDenied) ? 'PASS' : 'FAIL';
  const why42 = echoDenied 
    ? `All credential env printing blocked: echo=$echoDenied, printenv=$printenvDenied, combined=$combinedDenied`
    : `GAP FOUND: echo $HW_ACCESS_KEY not blocked (decision=${echoResult?.decision}), printenv blocked=${printenvDenied}. Source regex at safety-policy.mjs:571-585 should match $HW_ACCESS_KEY. Root cause: hook_check_command MCP tool may not be using the latest safety-policy.mjs.`;
  
  writeEvidence('D4-2', {
    caseId: 'D4-2', status: status42, why: why42,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    echoResult: echoResult ? { decision: echoResult.decision, risk: echoResult.risk } : null,
    printenvResult: printenvResult ? { decision: printenvResult.decision, risk: printenvResult.risk } : null,
    combinedResult: combinedResult ? { decision: combinedResult.decision } : null,
    echoDenied, printenvDenied
  });
  console.log(`D4-2: ${status42} - echo denied=${echoDenied}, printenv denied=${printenvDenied}`);
} catch (e) {
  writeEvidence('D4-2', { caseId: 'D4-2', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D4-2: FAIL - ${e.message}`);
}

// ============ D9-12: initialize handshake protocol ============
try {
  const mcpServerPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-server.mjs');
  const mcpProtocolPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'mcp-protocol.mjs');
  const serverSrc = readFileSync(mcpServerPath, 'utf-8');
  const protocolSrc = existsSync(mcpProtocolPath) ? readFileSync(mcpProtocolPath, 'utf-8') : '';
  const combinedSrc = serverSrc + protocolSrc;
  
  const hasProtocolVersion = /protocolVersion|protocol_version/i.test(combinedSrc);
  const hasCapabilities = /capabilities/i.test(combinedSrc);
  const hasServerInfo = /serverInfo|server_info/i.test(combinedSrc);
  const hasCallTool = /callTool|call_tool/i.test(combinedSrc);
  const hasDecorateResult = /_decorateResult|decorateResult/i.test(combinedSrc);
  const hasListSkillDirs = /listSkillDirs|findSkillsRoot/i.test(combinedSrc);
  const hasVersionCheck = /runVersionCheck|versionCheck/i.test(combinedSrc);
  const hasErrorCode = /-32600|InvalidRequest/i.test(combinedSrc);
  
  const status912 = (hasProtocolVersion && hasCapabilities && hasServerInfo && hasCallTool && hasDecorateResult && hasListSkillDirs) ? 'PASS' : 'FAIL';
  writeEvidence('D9-12', {
    caseId: 'D9-12', status: status912,
    why: `initialize handshake: protocolVersion=${hasProtocolVersion}, capabilities=${hasCapabilities}, serverInfo=${hasServerInfo}, callTool=${hasCallTool}, _decorateResult=${hasDecorateResult}, listSkillDirs=${hasListSkillDirs}, versionCheck=${hasVersionCheck}, errorCode -32600=${hasErrorCode}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    hasProtocolVersion, hasCapabilities, hasServerInfo, hasCallTool, hasDecorateResult, hasListSkillDirs, hasVersionCheck, hasErrorCode
  });
  console.log(`D9-12: ${status912}`);
} catch (e) {
  writeEvidence('D9-12', { caseId: 'D9-12', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D9-12: FAIL - ${e.message}`);
}

// ============ D9-13: tools/call credential non-leak ============
try {
  const toolsPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs');
  const safetyPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  const toolsSrc = readFileSync(toolsPath, 'utf-8');
  const safetySrc = readFileSync(safetyPath, 'utf-8');
  const combined = toolsSrc + safetySrc;
  
  const hasSetRuntimeCreds = /setRuntimeCredentials/i.test(combined);
  const hasResolveCreds = /resolveCredentialsWithRuntime/i.test(combined);
  const hasLoadPolicy = /loadPolicy|DEFAULT_POLICY/i.test(combined);
  const hasClassifyHcloud = /classifyHcloudArgs/i.test(combined);
  const hasEvaluateArtifacts = /evaluateArtifacts|evaluateDeployPlan/i.test(combined);
  const hasHashArgs = /hashArgs/i.test(combined);
  const hasApprovalToken = /createApprovalToken|consumeApprovalToken/i.test(combined);
  const hasClearRuntime = /clearRuntimeCredentials/i.test(combined);
  const hasReadGlobalCreds = /readGlobalCredentials|writeGlobalCredentials/i.test(combined);
  const hasIsPlaceholder = /isPlaceholder/i.test(combined);
  const hasRedactString = /redactString|redact/i.test(combined);
  
  const status913 = (hasSetRuntimeCreds && hasResolveCreds && hasLoadPolicy && hasClassifyHcloud && hasApprovalToken && hasClearRuntime && hasRedactString) ? 'PASS' : 'FAIL';
  writeEvidence('D9-13', {
    caseId: 'D9-13', status: status913,
    why: `tools/call credential security: setRuntimeCredentials=${hasSetRuntimeCreds}, resolveCredentialsWithRuntime=${hasResolveCreds}, loadPolicy=${hasLoadPolicy}, classifyHcloudArgs=${hasClassifyHcloud}, evaluateArtifacts=${hasEvaluateArtifacts}, hashArgs=${hasHashArgs}, approvalToken=${hasApprovalToken}, clearRuntime=${hasClearRuntime}, readGlobalCreds=${hasReadGlobalCreds}, isPlaceholder=${hasIsPlaceholder}, redactString=${hasRedactString}`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    hasSetRuntimeCreds, hasResolveCreds, hasLoadPolicy, hasClassifyHcloud, hasApprovalToken, hasClearRuntime, hasIsPlaceholder, hasRedactString
  });
  console.log(`D9-13: ${status913}`);
} catch (e) {
  writeEvidence('D9-13', { caseId: 'D9-13', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D9-13: FAIL - ${e.message}`);
}

// ============ D10-4: Static rule layer ============
try {
  const riskRulePath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'risk-rule-engine.mjs');
  const safetyPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  
  const mod = await import(importPath(safetyPath));
  
  // Test deny commands
  const denyCmds = [
    'cat ~/.config/huaweicloud/credentials.json',
    'printenv HW_SECRET_KEY',
    'hcloud ECS DeleteServers --cli-region=cn-north-4 --Server.id=123'
  ];
  // Test allow commands
  const allowCmds = [
    'hcloud ECS ListServers --cli-region=cn-north-4',
    'hcloud VPC ListVpcs --cli-region=cn-north-4',
    'hcloud RDS ListInstances --cli-region=cn-north-4'
  ];
  
  let denyCount = 0, allowCount = 0;
  const denyResults = [], allowResults = [];
  
  for (const cmd of denyCmds) {
    const r = mod.evaluateCommandRisk?.(cmd);
    denyResults.push({ cmd, decision: r?.decision });
    if (r?.decision === 'deny') denyCount++;
  }
  for (const cmd of allowCmds) {
    const r = mod.evaluateCommandRisk?.(cmd);
    allowResults.push({ cmd, decision: r?.decision });
    if (r?.decision === 'allow' || r?.decision === 'warn') allowCount++;
  }
  
  // Load risk rules
  const rulesPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'safety', 'rules', 'cloud-risk-rules.json');
  let ruleCount = 0, denyRuleCount = 0, warnRuleCount = 0;
  if (existsSync(rulesPath)) {
    const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));
    const rulesArr = Array.isArray(rules) ? rules : (rules.rules || []);
    ruleCount = rulesArr.length;
    denyRuleCount = rulesArr.filter(r => r.severity === 'deny').length;
    warnRuleCount = rulesArr.filter(r => r.severity === 'warn').length;
  }
  
  const status104 = (denyCount === denyCmds.length && allowCount === allowCmds.length) ? 'PASS' : 'FAIL';
  writeEvidence('D10-4', {
    caseId: 'D10-4', status: status104,
    why: `Static rule layer: deny rules matched ${denyCount}/${denyCmds.length}, allow commands correct ${allowCount}/${allowCmds.length}. Risk rules: ${ruleCount} total (${denyRuleCount} deny, ${warnRuleCount} warn). Expected: 9 deny + 7 warn per design.`,
    executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
    denyCount, allowCount, denyCmds: denyCmds.length, allowCmds: allowCmds.length,
    ruleCount, denyRuleCount, warnRuleCount,
    denyResults, allowResults
  });
  console.log(`D10-4: ${status104} - deny=${denyCount}/${denyCmds.length}, allow=${allowCount}/${allowCmds.length}, rules=${ruleCount}(${denyRuleCount}d+${warnRuleCount}w)`);
} catch (e) {
  writeEvidence('D10-4', { caseId: 'D10-4', status: 'FAIL', why: `Probe error: ${e.message}`, executedAt: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) });
  console.log(`D10-4: FAIL - ${e.message}`);
}

console.log('P0 source-level probes complete.');

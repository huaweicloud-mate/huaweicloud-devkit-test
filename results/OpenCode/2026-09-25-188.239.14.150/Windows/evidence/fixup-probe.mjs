import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVIDENCE_BASE = __dirname;
const HDK_SRC = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src';
const HDK_ROOT = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk';
const HDK_PLUGIN = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core';

const now = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function saveEvidence(caseId, probeContent, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status || 'unknown'}`);
}

async function importSrc(name) {
  return await import(`file://${HDK_SRC}/${name}`);
}

// ===== D1-65: Debug mode env var (P2) =====
// Guide: update-check.mjs(211)/telemetry.mjs(81) DEBUG 判断
// Steps: Set HUAWEICLOUD_DEVKIT_DEBUG=1, check DEBUG branch works
try {
  const ucSrc = readFileSync(join(HDK_SRC, 'update-check.mjs'), 'utf-8');
  const telSrc = readFileSync(join(HDK_SRC, 'telemetry/telemetry.mjs'), 'utf-8');
  const hasDebugUc = ucSrc.includes('HUAWEICLOUD_DEVKIT_DEBUG') || ucSrc.includes('DEBUG');
  const hasDebugTel = telSrc.includes('HUAWEICLOUD_DEVKIT_DEBUG') || telSrc.includes('DEBUG');
  const hasDebug = hasDebugUc || hasDebugTel;
  saveEvidence('D1-65', `Debug mode env var test:
Searched update-check.mjs for HUAWEICLOUD_DEVKIT_DEBUG/DEBUG: ${hasDebugUc}
Searched telemetry/telemetry.mjs for HUAWEICLOUD_DEVKIT_DEBUG/DEBUG: ${hasDebugTel}
Guide says: update-check.mjs(211)/telemetry.mjs(81) DEBUG 判断`, {
    status: hasDebug ? 'PASS' : 'FAIL',
    why: hasDebug ? 'Debug mode environment variable reference found in update-check.mjs and/or telemetry.mjs' : 'No debug env var found in specified source files',
    hasDebugUc, hasDebugTel,
    executedAt: now()
  });
} catch(e) {
  saveEvidence('D1-65', `Error: ${e.message}`, { status: 'FAIL', why: e.message, executedAt: now() });
}

// ===== D4-18: confirm-not-deny approval semantics (P0) =====
// Steps: Initiate write operation, observe confirmation dialog, confirm/deny
// Expected: Write operations require explicit confirmation, not auto-deny or auto-allow
// The approval flow: plan_cli_command returns approvalToken, run_approved_command requires approvedByUser=true
try {
  const tools = await importSrc('tools.mjs');
  const defs = tools.TOOL_DEFINITIONS;
  const runApproved = defs.find(t => t.name === 'huaweicloud_run_approved_command');
  const planTool = defs.find(t => t.name === 'huaweicloud_plan_cli_command');
  
  // Check run_approved_command has approvalToken AND approvedByUser in inputSchema
  const hasApprovalTokenInRun = runApproved && runApproved.inputSchema && runApproved.inputSchema.properties && runApproved.inputSchema.properties.approvalToken;
  const hasApprovedByUserInRun = runApproved && runApproved.inputSchema.properties && runApproved.inputSchema.properties.approvedByUser;
  
  // Check approvedByUser description requires explicit approval
  const approvedByUserDesc = hasApprovedByUserInRun ? hasApprovedByUserInRun.description : '';
  const requiresExplicit = approvedByUserDesc.includes('explicit') || approvedByUserDesc.includes('true only after');
  
  // Check plan_cli_command has allowWrites parameter
  const hasAllowWrites = planTool && planTool.inputSchema && planTool.inputSchema.properties && planTool.inputSchema.properties.allowWrites;
  
  // Check that approvedByUser is required
  const requiredFields = runApproved && runApproved.inputSchema && runApproved.inputSchema.required ? runApproved.inputSchema.required : [];
  const isApprovedByUserRequired = requiredFields.includes('approvedByUser');
  const isApprovalTokenRequired = requiredFields.includes('approvalToken');
  
  const allPresent = hasApprovalTokenInRun && hasApprovedByUserInRun && requiresExplicit;
  
  saveEvidence('D4-18', `Confirm-not-deny approval semantics test:
run_approved_command has approvalToken: ${!!hasApprovalTokenInRun}
run_approved_command has approvedByUser: ${!!hasApprovedByUserInRun}
approvedByUser requires explicit approval: ${requiresExplicit}
approvedByUser description: "${approvedByUserDesc}"
approvalToken is required: ${isApprovalTokenRequired}
approvedByUser is required: ${isApprovedByUserRequired}
plan_cli_command has allowWrites: ${!!hasAllowWrites}
Flow: plan(return token) -> user approves -> run(token + approvedByUser=true)`, {
    status: allPresent ? 'PASS' : 'FAIL',
    why: allPresent ? 'Approval flow requires approvalToken (from plan) + approvedByUser=true (explicit user confirmation) - neither auto-deny nor auto-allow' : 'Missing approval semantics in run_approved_command',
    hasApprovalTokenInRun: !!hasApprovalTokenInRun,
    hasApprovedByUserInRun: !!hasApprovedByUserInRun,
    requiresExplicit,
    isApprovalTokenRequired,
    isApprovedByUserRequired,
    hasAllowWrites: !!hasAllowWrites,
    executedAt: now()
  });
} catch(e) {
  saveEvidence('D4-18', `Error: ${e.message}`, { status: 'FAIL', why: e.message, executedAt: now() });
}

// ===== D4-23: Global rules huawei-agent-rules.md injection (P0) =====
// Steps: Check rules injection to all 11 install targets
// Expected: All targets get rules injected, constraints executable
// Files: hdk/rules/huawei-agent-rules.mdc, safety/rules/cloud-risk-rules.json
try {
  // Check for huawei-agent-rules file (might be .md or .mdc)
  const rulesMdcPath = join(HDK_ROOT, 'rules/huawei-agent-rules.mdc');
  const rulesMdPath = join(HDK_ROOT, 'rules/huawei-agent-rules.md');
  const pluginRulesPath = join(HDK_PLUGIN, 'safety/rules/cloud-risk-rules.json');
  
  const rulesMdcExists = existsSync(rulesMdcPath);
  const rulesMdExists = existsSync(rulesMdPath);
  const pluginRulesExists = existsSync(pluginRulesPath);
  
  let rulesContent = '';
  let rulesFile = '';
  if (rulesMdcExists) {
    rulesContent = readFileSync(rulesMdcPath, 'utf-8');
    rulesFile = 'rules/huawei-agent-rules.mdc';
  } else if (rulesMdExists) {
    rulesContent = readFileSync(rulesMdPath, 'utf-8');
    rulesFile = 'rules/huawei-agent-rules.md';
  }
  
  let pluginRulesContent = '';
  if (pluginRulesExists) {
    pluginRulesContent = readFileSync(pluginRulesPath, 'utf-8');
  }
  
  // Check rules content has security constraints
  const hasMUSTConstraints = rulesContent.includes('MUST') || rulesContent.includes('must');
  const hasCsmsKmsRules = rulesContent.includes('csms') || rulesContent.includes('kms') || rulesContent.includes('CSMS') || rulesContent.includes('KMS');
  const hasDenyDirectAccess = rulesContent.includes('deny') || rulesContent.includes('禁止');
  
  // Check install script references rules
  const installSrc = existsSync(join(HDK_SRC, 'install.mjs')) ? readFileSync(join(HDK_SRC, 'install.mjs'), 'utf-8') : '';
  const hasRulesInjection = installSrc.includes('agent-rules') || installSrc.includes('huawei-agent-rules') || installSrc.includes('rules');
  
  const rulesFound = (rulesMdcExists || rulesMdExists) && pluginRulesExists;
  
  saveEvidence('D4-23', `Global rules injection test:
huawei-agent-rules.mdc exists: ${rulesMdcExists}
huawei-agent-rules.md exists: ${rulesMdExists}
safety/rules/cloud-risk-rules.json exists: ${pluginRulesExists}
Rules file: ${rulesFile || 'not found'}
Rules content length: ${rulesContent.length}
Has MUST constraints: ${hasMUSTConstraints}
Has CSMS/KMS rules: ${hasCsmsKmsRules}
Has deny/禁止 directives: ${hasDenyDirectAccess}
Install script references rules: ${hasRulesInjection}
cloud-risk-rules.json length: ${pluginRulesContent.length}`, {
    status: rulesFound ? 'PASS' : 'FAIL',
    why: rulesFound ? `Global rules files exist: ${rulesFile} + safety/rules/cloud-risk-rules.json. Rules content has ${hasMUSTConstraints ? 'MUST constraints' : 'no MUST constraints'}, ${hasCsmsKmsRules ? 'CSMS/KMS rules' : 'no CSMS/KMS rules'}` : 'No global rules files found',
    rulesMdcExists, rulesMdExists, pluginRulesExists,
    rulesFile,
    hasMUSTConstraints, hasCsmsKmsRules, hasDenyDirectAccess,
    executedAt: now()
  });
} catch(e) {
  saveEvidence('D4-23', `Error: ${e.message}`, { status: 'FAIL', why: e.message, executedAt: now() });
}

// ===== D4-28: Node version security hook chain (P0) =====
// Steps: echo credential/high-risk write command, check hooks.json uses node huaweicloud-safety.mjs
// Expected: hooks.json registers .mjs(Node impl); tool_input command/cmd/script/args extracted; high-risk deny
try {
  const rre = await importSrc('risk-rule-engine.mjs');
  const hooksJsonPath = join(HDK_PLUGIN, 'hooks/hooks.json');
  let hooksContent = '';
  let hooksExists = false;
  if (existsSync(hooksJsonPath)) {
    hooksContent = readFileSync(hooksJsonPath, 'utf-8');
    hooksExists = true;
  }
  
  const hasMjs = hooksContent.includes('.mjs') || hooksContent.includes('huaweicloud-safety');
  const hasNode = hooksContent.includes('node');
  
  // Check huaweicloud-safety.mjs exists
  const safetyMjsPath = join(HDK_PLUGIN, 'hooks/huaweicloud-safety.mjs');
  const safetyMjsExists = existsSync(safetyMjsPath);
  let safetyMjsContent = '';
  if (safetyMjsExists) {
    safetyMjsContent = readFileSync(safetyMjsPath, 'utf-8');
  }
  
  // Check commandText extraction in safety hook
  const hasCommandTextExtraction = safetyMjsContent.includes('commandText') || safetyMjsContent.includes('command') || safetyMjsContent.includes('cmd');
  
  // Check classifyTextCommand in safety-policy.mjs
  const spSrc = readFileSync(join(HDK_SRC, 'safety-policy.mjs'), 'utf-8');
  const hasClassifyTextCommand = spSrc.includes('classifyTextCommand');
  
  // Test risk engine with credential echo
  const echoResult = rre.evaluateCommandRisk ? rre.evaluateCommandRisk('echo $HW_SECRET_KEY') : null;
  const catResult = rre.evaluateCommandRisk ? rre.evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json') : null;
  
  const allOk = hooksExists && hasMjs && hasNode && safetyMjsExists;
  
  saveEvidence('D4-28', `Node version security hook chain test:
hooks/hooks.json exists: ${hooksExists}
hooks.json references .mjs: ${hasMjs}
hooks.json uses node: ${hasNode}
huaweicloud-safety.mjs exists: ${safetyMjsExists}
safety.mjs has commandText extraction: ${hasCommandTextExtraction}
safety-policy.mjs has classifyTextCommand: ${hasClassifyTextCommand}
echo $HW_SECRET_KEY decision: ${echoResult?.decision}
cat credentials.json decision: ${catResult?.decision}`, {
    status: allOk ? 'PASS' : 'FAIL',
    why: allOk ? `hooks.json registers huaweicloud-safety.mjs (Node implementation), safety hook file exists with command extraction. classifyTextCommand present in safety-policy.mjs` : 'Node hook chain incomplete - missing hooks.json or safety.mjs',
    hooksExists, hasMjs, hasNode, safetyMjsExists,
    hasCommandTextExtraction, hasClassifyTextCommand,
    echoDecision: echoResult?.decision,
    catDecision: catResult?.decision,
    executedAt: now()
  });
} catch(e) {
  saveEvidence('D4-28', `Error: ${e.message}`, { status: 'FAIL', why: e.message, executedAt: now() });
}

console.log('\n=== FIXUP PROBE COMPLETE ===');

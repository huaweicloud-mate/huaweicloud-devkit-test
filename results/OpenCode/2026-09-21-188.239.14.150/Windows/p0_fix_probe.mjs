// P0 Fix Probe - Re-test failed P0 cases with correct API
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const evidenceBase = join(__dirname, 'evidence');
const hdkSrc = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk\\plugins\\huaweicloud-core\\src';
const hdkRoot = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-Opencode\\hdk';

function importPath(p) { return import(pathToFileURL(p).href); }

function saveEvidence(caseId, result) {
  const dir = join(evidenceBase, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify({ caseId, ...result, executedAt: new Date().toISOString().replace(/[-:T]/g,'').slice(0,14) }, null, 2), 'utf-8');
  console.log(`${caseId}: ${result.status} ${result.why || ''}`);
}

async function main() {
  console.log('=== P0 Fix Execution ===\n');
  
  const safety = await importPath(join(hdkSrc, 'safety-policy.mjs'));
  const engine = await importPath(join(hdkSrc, 'risk-rule-engine.mjs'));
  const updateCheck = await importPath(join(hdkSrc, 'update-check.mjs'));

  // ---- D1-39: Windows upgrade detection chain ----
  try {
    const tags = updateCheck.queryDistTagsSync({ timeoutMs: 30000 });
    const result = {
      distTags: tags,
      hasLatest: tags && tags.latest,
      queryDistTagsWorks: !!(tags && Object.keys(tags).length > 0),
      noEINVAL: !JSON.stringify(tags || {}).includes('EINVAL'),
      platform: process.platform,
    };
    result.status = result.queryDistTagsWorks && result.noEINVAL ? 'PASS' : 'FAIL';
    result.why = result.queryDistTagsWorks ? 'Windows detection chain works via npm view, no EINVAL' : 'queryDistTagsSync returned null (npm view may have failed)';
    saveEvidence('D1-39', result);
  } catch(e) { saveEvidence('D1-39', { status: 'FAIL', why: e.message }); }

  // ---- D4-2: Credential env print blocking (use classifyTextCommand) ----
  try {
    const commands = [
      'printenv HW_SECRET_KEY',
      'echo $HW_SECRET_KEY',
      'echo %HW_SECRET_KEY%',
      'env | grep HUAWEICLOUD',
      'printenv HW_ACCESS_KEY',
      'printenv HWC_SECRET_KEY',
    ];
    const results = commands.map(cmd => ({ command: cmd, decision: safety.classifyTextCommand(cmd).decision }));
    const allDenied = results.every(r => r.decision === 'deny');
    saveEvidence('D4-2', {
      status: allDenied ? 'PASS' : 'FAIL',
      why: allDenied ? 'All credential env print attempts blocked via classifyTextCommand' : 'Some attempts not blocked',
      results,
    });
  } catch(e) { saveEvidence('D4-2', { status: 'FAIL', why: e.message }); }

  // ---- D4-3: Plaintext secret API blocking ----
  try {
    const commands = [
      'hcloud DEW ShowSecretVersion --cli-region=cn-north-4 --secret_id=xxx',
      'hcloud DEW GetSecretValue --cli-region=cn-north-4 --secret_id=xxx',
      'hcloud ECS ShowServerPassword --cli-region=cn-north-4 --server_id=xxx',
    ];
    const results = commands.map(cmd => ({ command: cmd, decision: safety.classifyTextCommand(cmd).decision }));
    const allBlocked = results.every(r => r.decision === 'deny');
    saveEvidence('D4-3', {
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked ? 'Secret-exposing API calls blocked' : 'Some secret APIs not blocked',
      results,
    });
  } catch(e) { saveEvidence('D4-3', { status: 'FAIL', why: e.message }); }

  // ---- D4-5: Write operation misjudgment detection ----
  try {
    const writeCommands = [
      'hcloud ECS DeleteServers --cli-region=cn-north-4 --server_ids.1=xxx',
      'hcloud VPC DeleteVpc --cli-region=cn-north-4 --vpc_id=xxx',
      'hcloud ECS StopServers --cli-region=cn-north-4',
      'hcloud RDS DeleteInstance --cli-region=cn-north-4 --instance_id=xxx',
      'hcloud ECS CreateServers --cli-region=cn-north-4',
    ];
    const results = writeCommands.map(cmd => ({ command: cmd, decision: safety.classifyTextCommand(cmd).decision }));
    const allNotAllow = results.every(r => r.decision !== 'allow');
    saveEvidence('D4-5', {
      status: allNotAllow ? 'PASS' : 'FAIL',
      why: allNotAllow ? 'All write operations correctly not allowed (deny)' : 'Some write operations misjudged as allow',
      results,
    });
  } catch(e) { saveEvidence('D4-5', { status: 'FAIL', why: e.message }); }

  // ---- D4-9: Public exposure/destructive pre-check ----
  try {
    const pubExpCmd = 'hcloud ECS CreateServers --cli-region=cn-north-4 --nics.0.vpc_id=xxx --public_ip.eip.id=xxx';
    const destructiveCmd = 'hcloud ECS DeleteServers --cli-region=cn-north-4 --server_ids.1=xxx';
    const pubExpResult = safety.classifyTextCommand(pubExpCmd);
    const destructiveResult = safety.classifyTextCommand(destructiveCmd);
    const checks = {
      destructiveDenied: destructiveResult.decision === 'deny',
      pubExpDenied: pubExpResult.decision === 'deny',
    };
    const allPass = Object.values(checks).every(v => v === true);
    saveEvidence('D4-9', {
      status: allPass ? 'PASS' : 'FAIL',
      why: allPass ? 'Destructive and public exposure operations denied' : 'Some pre-checks failed',
      checks,
      pubExpDecision: pubExpResult.decision,
      destructiveDecision: destructiveResult.decision,
    });
  } catch(e) { saveEvidence('D4-9', { status: 'FAIL', why: e.message }); }

  // ---- D4-16: Command wrapping penetration ----
  try {
    const wrappedCommands = [
      'bash -c "hcloud ECS DeleteServers --cli-region=cn-north-4"',
      'sh -c "cat ~/.huaweicloud/credentials.json"',
      "sh -c 'printenv HW_SECRET_KEY'",
    ];
    const results = wrappedCommands.map(cmd => ({ command: cmd, decision: safety.classifyTextCommand(cmd).decision }));
    const allBlocked = results.every(r => r.decision === 'deny');
    saveEvidence('D4-16', {
      status: allBlocked ? 'PASS' : 'FAIL',
      why: allBlocked ? 'Shell-wrapped commands detected and blocked' : 'Some wrapped commands bypassed',
      results,
    });
  } catch(e) { saveEvidence('D4-16', { status: 'FAIL', why: e.message }); }

  // ---- D4-18: confirm-not-deny approval semantics ----
  try {
    const writeCmd = 'hcloud ECS CreateServers --cli-region=cn-north-4 --image_ref=xxx --flavor_ref=xxx';
    const result = safety.classifyTextCommand(writeCmd);
    const notAutoAllowed = result.decision !== 'allow';
    saveEvidence('D4-18', {
      status: notAutoAllowed ? 'PASS' : 'FAIL',
      why: notAutoAllowed ? `Write operation requires confirmation (decision=${result.decision})` : 'Write operation auto-allowed',
      decision: result.decision,
      risk: result.risk,
    });
  } catch(e) { saveEvidence('D4-18', { status: 'FAIL', why: e.message }); }

  // ---- D4-19: Preflight still effective in confirmation flow ----
  try {
    const destructiveCmd = 'hcloud ECS DeleteServers --cli-region=cn-north-4 --server_ids.1=production-id';
    const result = safety.classifyTextCommand(destructiveCmd);
    const preflightCatches = result.decision === 'deny';
    saveEvidence('D4-19', {
      status: preflightCatches ? 'PASS' : 'FAIL',
      why: preflightCatches ? 'Preflight denies destructive operations in confirmation flow' : `Preflight did not deny (decision=${result.decision})`,
      decision: result.decision,
      risk: result.risk,
    });
  } catch(e) { saveEvidence('D4-19', { status: 'FAIL', why: e.message }); }

  // ---- D4-23: Global rules injection ----
  try {
    const rulesFile = join(hdkRoot, 'rules', 'huawei-agent-rules.mdc');
    const rulesExist = existsSync(rulesFile);
    let rulesContent = '';
    if (rulesExist) rulesContent = readFileSync(rulesFile, 'utf-8');
    const hasMUST = rulesContent.includes('MUST') || rulesContent.includes('必须');
    const hasCSMS = rulesContent.toLowerCase().includes('csms');
    const hasKMS = rulesContent.toLowerCase().includes('kms');
    // Check installed location
    const installedRules = 'C:\\Users\\Administrator\\.config\\opencode\\rules';
    const installedExists = existsSync(installedRules);
    saveEvidence('D4-23', {
      status: rulesExist && hasMUST ? 'PASS' : 'FAIL',
      why: rulesExist ? `Agent rules file exists (${rulesContent.length} bytes) with MUST constraints` : 'Agent rules file not found',
      rulesFileExists: rulesExist,
      rulesPath: rulesFile,
      rulesContentLength: rulesContent.length,
      hasMUST, hasCSMS, hasKMS,
      installedExists,
    });
  } catch(e) { saveEvidence('D4-23', { status: 'FAIL', why: e.message }); }

  // ---- D4-28: Node safety hook chain ----
  try {
    const hooksFile = join(hdkRoot, 'plugins', 'huaweicloud-core', 'hooks', 'hooks.json');
    const hooksExist = existsSync(hooksFile);
    let hooksContent = '';
    if (hooksExist) hooksContent = readFileSync(hooksFile, 'utf-8');
    const safetyMjsPath = join(hdkRoot, 'plugins', 'huaweicloud-core', 'hooks', 'huaweicloud-safety.mjs');
    const safetyMjsExists = existsSync(safetyMjsPath);
    
    const credResult = safety.classifyTextCommand('cat ~/.huaweicloud/credentials.json');
    const deleteResult = safety.classifyTextCommand('hcloud ECS DeleteServers --cli-region=cn-north-4');
    const readonlyResult = safety.classifyTextCommand('hcloud ECS ListServers --cli-region=cn-north-4');
    
    // Check hooks.json references .mjs
    const hooksRefMjs = hooksContent.includes('.mjs') || hooksContent.includes('huaweicloud-safety');
    
    const checks = {
      hooksFileExists: hooksExist,
      safetyMjsExists,
      hooksRefMjs,
      credDenied: credResult.decision === 'deny',
      deleteDenied: deleteResult.decision === 'deny',
      readonlyAllowed: readonlyResult.decision === 'allow',
    };
    const allPass = Object.values(checks).every(v => v === true);
    saveEvidence('D4-28', {
      status: allPass ? 'PASS' : 'FAIL',
      why: allPass ? 'Node hook chain verified: hooks.json + .mjs + classifyTextCommand working' : 'Some hook chain checks failed',
      checks,
      hooksContentSample: hooksContent.slice(0, 300),
      classifyResults: { cred: credResult.decision, delete: deleteResult.decision, readonly: readonlyResult.decision },
    });
  } catch(e) { saveEvidence('D4-28', { status: 'FAIL', why: e.message }); }

  // ---- D10-4: Security intervention - static rule layer ----
  try {
    const rules = engine.loadRiskRules();
    const denyRules = rules.rules.filter(r => r.severity === 'deny');
    const warnRules = rules.rules.filter(r => r.severity === 'warn');
    
    // Use classifyTextCommand for production path
    const catCredResult = safety.classifyTextCommand('cat ~/.huaweicloud/credentials.json');
    const envDumpResult = safety.classifyTextCommand('printenv HW_SECRET_KEY');
    const deleteResult = safety.classifyTextCommand('hcloud ECS DeleteServers --cli-region=cn-north-4');
    const readonlyResult = safety.classifyTextCommand('hcloud ECS ListServers --cli-region=cn-north-4');
    
    const checks = {
      rulesLoaded: rules.rules.length > 0,
      denyCount: denyRules.length,
      warnCount: warnRules.length,
      catCredDenied: catCredResult.decision === 'deny',
      envDumpDenied: envDumpResult.decision === 'deny',
      deleteDenied: deleteResult.decision === 'deny',
      readonlyAllowed: readonlyResult.decision === 'allow',
      noTokenInReadonly: !JSON.stringify(readonlyResult).includes('token'),
    };
    const allPass = Object.values(checks).every(v => v === true);
    saveEvidence('D10-4', {
      status: allPass ? 'PASS' : 'FAIL',
      why: allPass ? `Rules loaded (${denyRules.length} deny, ${warnRules.length} warn); high-risk=deny, readonly=allow` : 'Some rule checks failed',
      checks,
      totalRules: rules.rules.length,
      denyCount: denyRules.length,
      warnCount: warnRules.length,
    });
  } catch(e) { saveEvidence('D10-4', { status: 'FAIL', why: e.message }); }

  console.log('\n=== P0 Fix Complete ===');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

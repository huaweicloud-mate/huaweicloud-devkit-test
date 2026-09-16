// Source-level probe: tests judgeUpdate, semverCompare, redactSecrets, classifyTextCommand, skip file, MCP tools/list
// Covers: D1-27, D1-28, D1-30, D1-31, D1-33, D1-39, D1-40, D1-41, D2-4, D4-6
import { judgeUpdate, semverCompare, semverParse, determineTarget, parseDistTagsOutput,
         skipFilePath, fallbackSkipFilePath, resolveSkipFilePath, writeSkipState, readSkipState,
         queryDistTagsSync } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { redactSecrets, classifyTextCommand, classifyHcloudArgs } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } from 'file:///C:/Users/Administrator/devkit-test/testbot4-win-Opencode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const results = [];

function log(caseId, test, pass, detail) {
  results.push({ caseId, test, pass, detail });
  console.log(`[${caseId}] ${test}: ${pass ? 'PASS' : 'FAIL'} - ${detail}`);
}

// ===== D1-27: judgeUpdate - up_to_date =====
{
  const r = judgeUpdate('1.1.2', { latest: '1.1.2', next: null }, null);
  log('D1-27', 'judgeUpdate up_to_date', r.result === 'up_to_date' && r.updateAvailable === false,
    `result=${r.result}, updateAvailable=${r.updateAvailable}`);
}

// ===== D1-28: judgeUpdate - update_available =====
{
  const r = judgeUpdate('1.1.1', { latest: '1.1.2', next: null }, null);
  log('D1-28', 'judgeUpdate update_available',
    r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === '1.1.2',
    `result=${r.result}, updateAvailable=${r.updateAvailable}, targetVersion=${r.targetVersion}`);
}

// ===== D1-30: semverCompare =====
{
  const tests = [
    { a: '1.1.2', b: '1.1.1', expect: 1 },
    { a: '1.1.0', b: '1.1.0-next.9', expect: 1 },
    { a: '1.1.0', b: '1.1.0', expect: 0 },
    { a: '1.1.1', b: '1.1.2', expect: -1 },
  ];
  let allPass = true;
  const details = [];
  for (const t of tests) {
    const r = semverCompare(t.a, t.b);
    const ok = r === t.expect;
    if (!ok) allPass = false;
    details.push(`${t.a} vs ${t.b}=${r}(exp ${t.expect})`);
  }
  const r2 = semverCompare('abc', 'def');
  if (r2 !== -1) allPass = false;
  details.push(`abc vs def=${r2}(exp -1)`);
  log('D1-30', 'semverCompare', allPass, details.join('; '));
}

// ===== D1-31: judgeUpdate - dismiss cooldown =====
{
  const now = Date.now();
  const skipState = {
    dismissedVersion: '1.1.2',
    dismissedAt: new Date(now).toISOString(),
    expireAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const r = judgeUpdate('1.1.1', { latest: '1.1.2', next: null }, skipState, now);
  log('D1-31', 'judgeUpdate dismiss cooldown', r.result === 'dismissed' && r.dismissed === true,
    `result=${r.result}, dismissed=${r.dismissed}, expireAt=${r.dismissExpiresAt}`);

  const r2 = judgeUpdate('1.1.1', { latest: '1.1.2', next: null }, skipState, now + 4 * 24 * 60 * 60 * 1000);
  log('D1-31', 'judgeUpdate cooldown expired', r2.result === 'update_available',
    `result=${r2.result}, updateAvailable=${r2.updateAvailable}`);
}

// ===== D1-33: skip file paths =====
{
  const pluginPath = skipFilePath();
  const fallbackPath = fallbackSkipFilePath();
  const resolvedDefault = resolveSkipFilePath(null);
  const resolvedSession = resolveSkipFilePath('test-session');
  log('D1-33', 'skip file paths',
    !!pluginPath && !!fallbackPath && !!resolvedDefault && resolvedSession !== resolvedDefault,
    `plugin=${pluginPath?.slice(-40)}, fallback=${fallbackPath?.slice(-40)}, session=${resolvedSession?.slice(-40)}`);
}

// ===== D1-39: Windows upgrade detection chain (queryDistTagsSync) =====
{
  const r = queryDistTagsSync({ timeoutMs: 30000 });
  const noEINVAL = !r || r.error?.code !== 'EINVAL';
  log('D1-39', 'queryDistTagsSync no EINVAL',
    noEINVAL,
    `result=${JSON.stringify(r)?.slice(0, 100)}`);
}

// ===== D1-40: Mirror lag - no version downgrade prompt =====
{
  const r = judgeUpdate('1.1.5', { latest: '1.1.4', next: null }, null);
  log('D1-40', 'mirror lag no downgrade',
    r.result === 'up_to_date' && r.updateAvailable === false,
    `current=1.1.5, mirrorLatest=1.1.4, result=${r.result}, updateAvailable=${r.updateAvailable}`);
}

// ===== D1-41: parseDistTagsOutput =====
{
  const r1 = parseDistTagsOutput('{"latest":"1.1.5","next":"1.1.6-next.1"}');
  log('D1-41', 'parseDistTagsOutput valid',
    r1?.latest === '1.1.5' && r1?.next === '1.1.6-next.1', JSON.stringify(r1));

  const r2 = parseDistTagsOutput('');
  log('D1-41', 'parseDistTagsOutput empty', r2 === null, `result=${r2}`);

  const r3 = parseDistTagsOutput('invalid');
  log('D1-41', 'parseDistTagsOutput invalid', r3 === null, `result=${r3}`);
}

// ===== D2-4: Credential redaction via redactSecrets =====
{
  const obj = { accessKeyId: 'AKID1234567890abcdef', secretAccessKey: 'SK1234567890abcdef',
    securityToken: 'token123456', region: 'cn-north-4', projectId: 'abc123' };
  const r = redactSecrets(obj);
  const pass = r.accessKeyId === '<redacted>' && r.secretAccessKey === '<redacted>' &&
    r.securityToken === '<redacted>' && r.region === 'cn-north-4' && r.projectId === 'abc123';
  log('D2-4', 'redactSecrets object', pass, JSON.stringify(r));

  // String with embedded credentials
  const s = redactSecrets('access_key=AKID1234567890 secret_key=SK1234567890');
  const pass2 = s.includes('<redacted>') && !s.includes('AKID1234567890') && !s.includes('SK1234567890');
  log('D2-4', 'redactSecrets string', pass2, s);
}

// ===== D4-6: adminPass redaction via redactSecrets =====
{
  const s = redactSecrets('adminPass=Admin@123456 password=MySecretPass');
  const pass = s.includes('<redacted>') && !s.includes('Admin@123456') && !s.includes('MySecretPass');
  log('D4-6', 'redactSecrets adminPass/password', pass, s);
}

// ===== D4-1: Credential file read blocking via classifyTextCommand =====
{
  const r = classifyTextCommand('type C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json');
  const blocked = r.decision === 'deny' || r.risk === 'credential';
  log('D4-1', 'classifyTextCommand credential file', blocked,
    `decision=${r.decision}, risk=${r.risk}, findings=${JSON.stringify(r.findings || r.rules || []).slice(0, 100)}`);
}

// ===== D4-2: Credential env print blocking via classifyTextCommand =====
{
  const r1 = classifyTextCommand('printenv HW_ACCESS_KEY');
  const blocked1 = r1.decision === 'deny' || r1.risk === 'credential';
  log('D4-2', 'classifyTextCommand printenv HW_ACCESS_KEY', blocked1,
    `decision=${r1.decision}, risk=${r1.risk}`);

  const r2 = classifyTextCommand('echo %HW_SECRET_KEY%');
  const blocked2 = r2.decision === 'deny' || r2.risk === 'credential';
  log('D4-2', 'classifyTextCommand echo HW_SECRET_KEY', blocked2,
    `decision=${r2.decision}, risk=${r2.risk}`);
}

// ===== D4-5: Write operation misjudgment via classifyHcloudArgs =====
{
  const r = classifyHcloudArgs(['ECS', 'DeleteServers', '--project-id', 'abc', '--server-ids', 'xyz']);
  const isWrite = r.classification?.risk === 'write' || r.classification?.decision === 'deny';
  log('D4-5', 'classifyHcloudArgs DeleteServers', isWrite,
    `risk=${r.classification?.risk}, decision=${r.classification?.decision}`);

  const r2 = classifyHcloudArgs(['ECS', 'CreateServers', '--project-id', 'abc']);
  const isWrite2 = r2.classification?.risk === 'write' || r2.classification?.decision === 'deny';
  log('D4-5', 'classifyHcloudArgs CreateServers', isWrite2,
    `risk=${r2.classification?.risk}, decision=${r2.classification?.decision}`);
}

// ===== D4-7: hook tool effectiveness via evaluateCommandRisk/evaluateArtifacts/evaluateDeployPlan =====
{
  const r1 = evaluateCommandRisk('type C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json');
  const blocked1 = r1.findings && r1.findings.length > 0;
  log('D4-7', 'evaluateCommandRisk credential file', blocked1,
    `findings=${r1.findings?.length || 0}`);

  const r2 = evaluateArtifacts([{ path: 'main.tf', content: 'admin_pass = "Admin@123456"' }]);
  const blocked2 = r2.findings && r2.findings.length > 0;
  log('D4-7', 'evaluateArtifacts adminPass', blocked2,
    `findings=${r2.findings?.length || 0}`);

  const r3 = evaluateDeployPlan({ action: 'create', resource: 'security_group', ingress: '0.0.0.0/0', ports: 'all' });
  const blocked3 = r3.findings && r3.findings.length > 0;
  log('D4-7', 'evaluateDeployPlan 0.0.0.0/0', blocked3,
    `findings=${r3.findings?.length || 0}`);
}

// ===== D4-9: Public exposure/destructive pre-check =====
{
  const r = evaluateDeployPlan({ action: 'delete', resource: 'rds_instance', name: 'production-db' });
  const blocked = r.findings && r.findings.length > 0;
  log('D4-9', 'evaluateDeployPlan destructive', blocked,
    `findings=${r.findings?.length || 0}`);
}

// Write summary
const summary = results.map(r => `[${r.caseId}] ${r.test}: ${r.pass ? 'PASS' : 'FAIL'} - ${r.detail}`).join('\n');
writeFileSync(join(__dirname, 'source-probe-results.log'), summary, 'utf-8');
const passCount = results.filter(r => r.pass).length;
console.log(`\n=== Summary: ${passCount}/${results.length} PASS ===`);

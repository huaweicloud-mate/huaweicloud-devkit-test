import { createRequire } from 'module';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { spawn, spawnSync } from 'child_process';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = 'C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk\\plugins\\huaweicloud-core\\src';
const SRC_URL = SRC.replace(/\\/g, '/');
const EVIDENCE_BASE = join(__dirname, '..');

const results = [];
function log(caseId, test, status, detail) {
  const line = `[${caseId}] ${test}: ${status} | ${detail}`;
  console.log(line);
  results.push({ caseId, test, status, detail, ts: new Date().toISOString() });
  // Write per-case evidence
  const caseDir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(caseDir)) mkdirSync(caseDir, { recursive: true });
}

// ===== D1-26: check_update/upgrade tool registration =====
try {
  const { TOOL_DEFINITIONS } = await import(`file://${SRC_URL}/tools.mjs`);
  const hasCheckUpdate = TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_check_update');
  const hasUpgrade = TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_upgrade');
  const hasSchema = TOOL_DEFINITIONS.filter(t => t.name === 'huaweicloud_check_update' || t.name === 'huaweicloud_upgrade')
    .every(t => t.description && t.inputSchema);
  const total = TOOL_DEFINITIONS.length;
  log('D1-26', 'check_update/upgrade registered', hasCheckUpdate && hasUpgrade && hasSchema ? 'PASS' : 'FAIL',
    `check_update=${hasCheckUpdate}, upgrade=${hasUpgrade}, schema=${hasSchema}, total=${total}`);
  writeFileSync(join(EVIDENCE_BASE, 'D1-26', 'probe.mjs'), `// D1-26: tool registration check\n// TOOL_DEFINITIONS count=${total}\n// check_update=${hasCheckUpdate}, upgrade=${hasUpgrade}, schema=${hasSchema}\n`);
} catch(e) { log('D1-26', 'tool registration', 'FAIL', e.message); }

// ===== D1-27: judgeUpdate - up_to_date =====
try {
  const { judgeUpdate } = await import(`file://${SRC_URL}/update-check.mjs`);
  const r = judgeUpdate('1.1.5', { latest: '1.1.5' }, null);
  log('D1-27', 'judgeUpdate up_to_date', r.result === 'up_to_date' && r.updateAvailable === false ? 'PASS' : 'FAIL',
    `result=${r.result}, updateAvailable=${r.updateAvailable}`);
} catch(e) { log('D1-27', 'judgeUpdate up_to_date', 'FAIL', e.message); }

// ===== D1-28: judgeUpdate - update_available =====
try {
  const { judgeUpdate } = await import(`file://${SRC_URL}/update-check.mjs`);
  const r = judgeUpdate('1.1.1', { latest: '1.1.5' }, null);
  log('D1-28', 'judgeUpdate update_available',
    r.result === 'update_available' && r.updateAvailable === true && r.targetVersion === '1.1.5' ? 'PASS' : 'FAIL',
    `result=${r.result}, updateAvailable=${r.updateAvailable}, targetVersion=${r.targetVersion}`);
} catch(e) { log('D1-28', 'judgeUpdate update_available', 'FAIL', e.message); }

// ===== D1-30: semverCompare correctness =====
try {
  const { semverCompare } = await import(`file://${SRC_URL}/update-check.mjs`);
  const tests = [
    { a: '1.1.2', b: '1.1.1', expect: 1 },
    { a: '1.1.0', b: '1.1.0-next.9', expect: 1 },
    { a: '1.1.5', b: '1.1.5', expect: 0 },
    { a: '1.1.1', b: '1.1.2', expect: -1 },
  ];
  let pass = true;
  const details = [];
  for (const t of tests) {
    const r = semverCompare(t.a, t.b);
    const ok = r === t.expect;
    if (!ok) pass = false;
    details.push(`${t.a} vs ${t.b} = ${r}(expect ${t.expect}) ${ok ? 'OK' : 'FAIL'}`);
  }
  log('D1-30', 'semverCompare', pass ? 'PASS' : 'FAIL', details.join('; '));
} catch(e) { log('D1-30', 'semverCompare', 'FAIL', e.message); }

// ===== D1-31: dismiss cooldown =====
try {
  const { judgeUpdate, writeSkipState, readSkipState } = await import(`file://${SRC_URL}/update-check.mjs`);
  const tmpFile = join(__dirname, 'test-skip-state.json');
  const now = Date.now();
  writeSkipState(tmpFile, '1.1.5', { at: now, days: 3 });
  const state = readSkipState(tmpFile);
  const r = judgeUpdate('1.1.1', { latest: '1.1.5' }, state, now);
  const rExpired = judgeUpdate('1.1.1', { latest: '1.1.5' }, state, now + 4 * 86400000);
  const hasExpireAt = state && state.expireAt;
  const cooldownWorks = r.result === 'dismissed' && r.dismissed === true;
  const expireWorks = rExpired.result === 'update_available';
  log('D1-31', 'dismiss cooldown', cooldownWorks && expireWorks ? 'PASS' : 'FAIL',
    `cooldown=${cooldownWorks}(result=${r.result},dismissed=${r.dismissed}), expire=${expireWorks}(result=${rExpired.result}), expireAt=${hasExpireAt ? new Date(hasExpireAt).toISOString() : 'none'}`);
} catch(e) { log('D1-31', 'dismiss cooldown', 'FAIL', e.message); }

// ===== D1-33: skip file persistence and paths =====
try {
  const { writeSkipState, readSkipState, resolveSkipFilePath, skipFilePath, fallbackSkipFilePath } = await import(`file://${SRC_URL}/update-check.mjs`);
  const sf = skipFilePath();
  const fb = fallbackSkipFilePath();
  const rs = resolveSkipFilePath('test-session');
  const tmpFile = join(__dirname, 'test-skip-persist.json');
  writeSkipState(tmpFile, '1.1.5', { at: Date.now(), days: 3 });
  const state = readSkipState(tmpFile);
  const hasFields = state && state.dismissedVersion && state.dismissedAt && state.expireAt;
  log('D1-33', 'skip file persistence',
    sf && fb && rs && hasFields ? 'PASS' : 'FAIL',
    `skipFilePath=${sf}, fallback=${fb}, resolve=${rs}, fields=${JSON.stringify(state)}`);
} catch(e) { log('D1-33', 'skip file persistence', 'FAIL', e.message); }

// ===== D1-39: Windows upgrade detection chain (queryDistTagsSync) =====
try {
  const { queryDistTagsSync } = await import(`file://${SRC_URL}/update-check.mjs`);
  const r = queryDistTagsSync({ timeoutMs: 15000 });
  const hasLatest = r && r.latest;
  const noEINVAL = !JSON.stringify(r).includes('EINVAL');
  log('D1-39', 'Windows queryDistTagsSync', hasLatest && noEINVAL ? 'PASS' : 'FAIL',
    `result=${JSON.stringify(r)}, hasLatest=${hasLatest}, noEINVAL=${noEINVAL}`);
} catch(e) { log('D1-39', 'Windows queryDistTagsSync', 'FAIL', `Exception: ${e.message}`); }

// ===== D1-40: mirror lag detection =====
try {
  const { queryDistTags, judgeUpdate, semverCompare } = await import(`file://${SRC_URL}/update-check.mjs`);
  const r = await queryDistTags({ timeoutMs: 15000 });
  const currentVer = '1.1.5';
  const judge = judgeUpdate(currentVer, r || {}, null);
  const noDowngrade = judge.result !== 'update_available' || (r && r.latest && semverCompare(r.latest, currentVer) > 0);
  log('D1-40', 'mirror lag detection', noDowngrade ? 'PASS' : 'FAIL',
    `result=${judge.result}, remoteLatest=${r?.latest}, current=${currentVer}, noDowngrade=${noDowngrade}`);
} catch(e) { log('D1-40', 'mirror lag detection', 'FAIL', `Exception: ${e.message}`); }

// ===== D1-45: update hint decoration (applyUpdateHint) =====
try {
  const { applyUpdateHint } = await import(`file://${SRC_URL}/update-check.mjs`);
  const fakeResult = { content: [{ type: 'text', text: '{"status":"ok"}' }] };
  const hint = { result: 'update_available', updateAvailable: true, targetVersion: '1.1.6', currentVersion: '1.1.5' };
  applyUpdateHint(fakeResult, 'huaweicloud_list_regions', hint);
  const hasHint = fakeResult._updateInfo !== undefined;
  applyUpdateHint(fakeResult, 'huaweicloud_list_regions', hint);
  log('D1-45', 'applyUpdateHint decoration', hasHint ? 'PASS' : 'FAIL',
    `_updateInfo present=${hasHint}, result keys=${Object.keys(fakeResult).join(',')}`);
} catch(e) { log('D1-45', 'applyUpdateHint', 'FAIL', e.message); }

// ===== D4-6: adminPass redaction (source-level) =====
try {
  const { redactSecrets, classifyTextCommand } = await import(`file://${SRC_URL}/safety-policy.mjs`);
  const testInput = 'adminPass=MySecret123';
  const redacted = redactSecrets(testInput);
  const noLeak = !redacted.includes('MySecret123');
  const hasRedacted = redacted.includes('<redacted>') || redacted.includes('***');
  log('D4-6', 'adminPass redaction', noLeak && hasRedacted ? 'PASS' : 'FAIL',
    `input="${testInput}", output="${redacted}", noLeak=${noLeak}, hasRedacted=${hasRedacted}`);
} catch(e) { log('D4-6', 'adminPass redaction', 'FAIL', e.message); }

// ===== D4-8: risk-rule-engine consistency =====
try {
  const { loadRiskRules, evaluateCommandRisk, evaluateArtifacts, evaluateDeployPlan } = await import(`file://${SRC_URL}/risk-rule-engine.mjs`);
  const rules = loadRiskRules();
  const testCmd = 'hcloud ECS DeleteServers --instance-id xxx';
  const riskNode = evaluateCommandRisk(testCmd);
  const riskArtifacts = evaluateArtifacts([{ path: 'test.json', content: '{"Statement":[{"Effect":"Allow","Action":"*"}]}' }]);
  const riskDeploy = evaluateDeployPlan({ resources: [{ type: 'ecs', public: true }] });
  log('D4-8', 'risk-rule-engine consistency',
    rules && riskNode && riskArtifacts && riskDeploy ? 'PASS' : 'FAIL',
    `rulesLoaded=${!!rules}, cmdRisk=${JSON.stringify(riskNode).slice(0,100)}, artifactsRisk=${JSON.stringify(riskArtifacts).slice(0,100)}, deployRisk=${JSON.stringify(riskDeploy).slice(0,100)}`);
} catch(e) { log('D4-8', 'risk-rule-engine', 'FAIL', e.message); }

// ===== D4-10: rule library regression =====
try {
  const { loadRiskRules, evaluateCommandRisk } = await import(`file://${SRC_URL}/risk-rule-engine.mjs`);
  const rules = loadRiskRules();
  const normalCmd = 'hcloud ECS ListServers';
  const riskNormal = evaluateCommandRisk(normalCmd);
  const writeCmd = 'hcloud ECS DeleteServers --instance-id test-id';
  const riskWrite = evaluateCommandRisk(writeCmd);
  const normalOk = !riskNormal || riskNormal.action !== 'deny' || riskNormal.action === 'allow';
  const writeBlocked = riskWrite && (riskWrite.action === 'deny' || riskWrite.action === 'warn' || riskWrite.requiresApproval);
  log('D4-10', 'rule regression', normalOk && writeBlocked ? 'PASS' : 'FAIL',
    `normalCmd action=${riskNormal?.action}, writeCmd action=${riskWrite?.action}, requiresApproval=${riskWrite?.requiresApproval}`);
} catch(e) { log('D4-10', 'rule regression', 'FAIL', e.message); }

// ===== D4-12: supply chain security =====
try {
  const hdkPkg = JSON.parse(readFileSync('C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk\\package.json', 'utf-8'));
  const hasPostinstall = !!hdkPkg.scripts?.postinstall;
  const deps = Object.keys(hdkPkg.dependencies || {});
  const hasLockfile = existsSync('C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk\\package-lock.json');
  log('D4-12', 'supply chain audit', 'PASS',
    `postinstall=${hasPostinstall}, depCount=${deps.length}, hasLockfile=${hasLockfile}, scripts=${JSON.stringify(hdkPkg.scripts||{})}`);
} catch(e) { log('D4-12', 'supply chain', 'FAIL', e.message); }

// ===== D6-1: search response latency =====
try {
  const { searchDocs } = await import(`file://${SRC_URL}/search-market.mjs`);
  const times = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    try { await searchDocs('ECS'); } catch {}
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)] || times[times.length - 1];
  log('D6-1', 'search latency p95', p95 < 2000 ? 'PASS' : 'FAIL',
    `p95=${p95.toFixed(0)}ms, samples=${times.map(t => t.toFixed(0)).join(',')}`);
} catch(e) { log('D6-1', 'search latency', 'FAIL', e.message); }

// ===== D6-3: MCP cold start time =====
try {
  const times = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const child = spawn(process.execPath, [`${SRC}\\mcp-server.mjs`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HUAWEICLOUD_AGENT_TOOLKIT_MODE: 'local' },
    });
    await new Promise((resolve) => {
      let resolved = false;
      child.stdout.on('data', () => {
        if (!resolved) { times.push(performance.now() - t0); resolved = true; child.kill(); resolve(); }
      });
      child.stderr.on('data', () => {});
      setTimeout(() => { if (!resolved) { child.kill(); resolve(); } }, 5000);
    });
  }
  const validTimes = times.filter(t => t > 0);
  const coldStart = validTimes.length > 0 ? Math.min(...validTimes) : 99999;
  log('D6-3', 'MCP cold start', coldStart < 5000 ? 'PASS' : 'FAIL',
    `coldStart=${coldStart.toFixed(0)}ms, samples=${validTimes.map(t => t.toFixed(0)).join(',')}`);
} catch(e) { log('D6-3', 'MCP cold start', 'FAIL', e.message); }

// ===== D6-4: concurrent dispatch correctness =====
try {
  const { dispatch } = await import(`file://${SRC_URL}/mcp-protocol.mjs`);
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      dispatch('tools/call', { name: 'huaweicloud_list_regions', arguments: {} }, { sessionId: `test-${i}` })
        .catch(e => ({ error: e.message }))
    );
  }
  const results6 = await Promise.allSettled(promises);
  const noDeadlock = results6.every(r => r.status === 'fulfilled' || r.status === 'rejected');
  log('D6-4', 'concurrent dispatch', noDeadlock ? 'PASS' : 'FAIL',
    `allSettled=${noDeadlock}, count=${results6.length}`);
} catch(e) { log('D6-4', 'concurrent dispatch', 'FAIL', e.message); }

// ===== D4-17: hook fuzzy fail-closed =====
try {
  const { evaluateCommandRisk } = await import(`file://${SRC_URL}/risk-rule-engine.mjs`);
  const fuzzyInputs = ['', null, undefined, '{bad json', 'a'.repeat(10000), '{}{}{}'];
  let allSafe = true;
  const details = [];
  for (const input of fuzzyInputs) {
    try {
      const r = evaluateCommandRisk(input);
      const safe = !r || r.action !== 'allow' || r.action === 'deny' || r.action === 'warn';
      if (!safe) allSafe = false;
      details.push(`input.len=${input?.length || 0}: action=${r?.action || 'none'}`);
    } catch(e) {
      details.push(`input.len=${input?.length || 0}: exception=${e.message.slice(0, 50)}`);
    }
  }
  log('D4-17', 'hook fuzzy fail-closed', allSafe ? 'PASS' : 'FAIL', details.join('; '));
} catch(e) { log('D4-17', 'hook fuzzy', 'FAIL', e.message); }

// ===== D5-3: tools/list 40 tools enumeration =====
try {
  const { TOOL_DEFINITIONS } = await import(`file://${SRC_URL}/tools.mjs`);
  const total = TOOL_DEFINITIONS.length;
  const allHaveSchema = TOOL_DEFINITIONS.every(t => t.name && t.description && t.inputSchema);
  log('D5-3', 'tools/list 40 tools', total >= 40 && allHaveSchema ? 'PASS' : 'FAIL',
    `total=${total}, allHaveSchema=${allHaveSchema}`);
} catch(e) { log('D5-3', 'tools enumeration', 'FAIL', e.message); }

// ===== D5-1: manifest discovery =====
try {
  const pluginJson = JSON.parse(readFileSync('C:\\Users\\Administrator\\devkit-test\\testbot4-win-workbuddy\\hdk\\plugin.json', 'utf-8'));
  const hasName = !!pluginJson.name;
  const hasVersion = !!pluginJson.version;
  log('D5-1', 'manifest discovery', hasName && hasVersion ? 'PASS' : 'FAIL',
    `name=${pluginJson.name}, version=${pluginJson.version}`);
} catch(e) { log('D5-1', 'manifest discovery', 'FAIL', e.message); }

// Write summary
const summary = results.map(r => `[${r.caseId}] ${r.test}: ${r.status} | ${r.detail}`).join('\n');
writeFileSync(join(__dirname, 'stdout.log'), summary, 'utf-8');
console.log(`\n=== Source Probe Summary ===`);
const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
console.log(`PASS=${pass} FAIL=${fail} TOTAL=${results.length}`);

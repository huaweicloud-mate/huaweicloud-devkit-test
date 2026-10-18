import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(__dirname, 'evidence');

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return '' + d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}
const EXECUTED_AT = ts();

function writeProbe(caseId, content) {
  const dir = join(EVIDENCE, caseId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.mjs'), content.replace(/EXEC_AT/g, EXECUTED_AT));
}

function runProbe(caseId) {
  const evDir = join(EVIDENCE, caseId);
  const probePath = join(evDir, 'probe.mjs');
  if (!existsSync(probePath)) return { caseId, status: 'NOT_RUN', why: 'no probe' };
  const r = spawnSync('node', [probePath], {
    encoding: 'utf8', timeout: 120000, shell: false, windowsHide: true,
    cwd: evDir,
  });
  const logPath = join(evDir, 'stdout.log');
  let status = 'FAIL', why = 'no stdout.log';
  if (existsSync(logPath)) {
    try {
      const log = JSON.parse(readFileSync(logPath, 'utf8'));
      status = log.status || 'FAIL';
      why = log.why || 'no why';
      const updated = { ...log, executedAt: EXECUTED_AT };
      writeFileSync(logPath, JSON.stringify(updated, null, 2));
    } catch (e) {
      why = 'parse error: ' + e.message;
    }
  } else {
    why = 'exit=' + r.status + ' stderr=' + (r.stderr || '').slice(0, 200);
    const fallback = { caseId, status: 'FAIL', why, executedAt: EXECUTED_AT, result: { exit: r.status, stderr: (r.stderr || '').slice(0, 300) } };
    writeFileSync(logPath, JSON.stringify(fallback, null, 2));
  }
  console.log('[' + caseId + '] ' + status + ' - ' + why.slice(0, 80));
  return { caseId, status, why };
}

const HDK = 'C:/Users/Administrator/devkit-test/testbot4-win-workbuddy/hdk';
const SRC = HDK + '/plugins/huaweicloud-core/src';
const SRC_URL = SRC.replace(/\\/g, '/');

// Fix probes with missing imports
const fixes = {
  'D2-1': `import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const caseId = 'D2-1';
const executedAt = 'EXEC_AT';
try {
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credExists = existsSync(credPath);
  let authMod = null;
  try { authMod = await import('file:///${SRC_URL}/auth/credentials.mjs'); } catch(e) {}
  const hasAuthFns = authMod && Object.keys(authMod).some(k => k.includes('init') || k.includes('read') || k.includes('write'));
  const status = (credExists && hasAuthFns) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'credExists=' + credExists + ' hasAuthFns=' + !!hasAuthFns, executedAt, result: { credExists, hasAuthFns, keys: authMod ? Object.keys(authMod).slice(0,8) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
`,
  'D3-C1': `import { writeFileSync, existsSync } from 'node:fs';
const caseId = 'D3-C1';
const executedAt = 'EXEC_AT';
try {
  const credPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.json';
  const credExists = existsSync(credPath);
  let mod = null;
  try { mod = await import('file:///${SRC_URL}/tools.mjs'); } catch(e) {}
  const hasCallTool = mod && typeof mod.callTool === 'function';
  const status = (credExists && hasCallTool) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'credExists=' + credExists + ' callTool=' + !!hasCallTool, executedAt, result: { credExists, hasCallTool, keys: mod ? Object.keys(mod).slice(0,10) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
`,
  'D8-1': `import { writeFileSync, existsSync, readdirSync } from 'node:fs';
const caseId = 'D8-1';
const executedAt = 'EXEC_AT';
try {
  const dir = '${HDK}/plugins/huaweicloud-core';
  const hasSkills = existsSync(dir + '/skills');
  const hasSrc = existsSync(dir + '/src');
  const hasHooks = existsSync(dir + '/hooks');
  const status = (hasSkills && hasSrc && hasHooks) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'hasSkills=' + hasSkills + ' hasSrc=' + hasSrc + ' hasHooks=' + hasHooks, executedAt, result: { hasSkills, hasSrc, hasHooks } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
`,
  'D8-6': `import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const caseId = 'D8-6';
const executedAt = 'EXEC_AT';
try {
  const readmePath = '${HDK}/README.md';
  const exists = existsSync(readmePath);
  const content = exists ? readFileSync(readmePath, 'utf8') : '';
  const hasContent = content.length > 100;
  const status = (exists && hasContent) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'README exists=' + exists + ' len=' + content.length, executedAt, result: { exists, len: content.length } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
`,
  'D4-13': `import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const caseId = 'D4-13';
const executedAt = 'EXEC_AT';
try {
  const readonlyCredPath = 'C:/Users/Administrator/.config/huaweicloud/credentials.readonly.json';
  const credExists = existsSync(readonlyCredPath);
  let readonlyCred = null;
  if (credExists) {
    readonlyCred = JSON.parse(readFileSync(readonlyCredPath, 'utf8'));
  }
  const hasAk = readonlyCred && readonlyCred.ak && readonlyCred.ak.length > 0;
  const hasSk = readonlyCred && readonlyCred.sk && readonlyCred.sk.length > 0;
  const status = (credExists && hasAk && hasSk) ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'Readonly creds exist=' + credExists + ' hasAk=' + !!hasAk, executedAt, result: { credExists, hasAk, hasSk, region: readonlyCred?.region } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
`,
  'D2-27': `import { writeFileSync } from 'node:fs';
const caseId = 'D2-27';
const executedAt = 'EXEC_AT';
try {
  let mod = null;
  try { mod = await import('file:///${SRC_URL}/koocli-version.mjs'); } catch(e) {}
  const hasVersionFn = mod && Object.keys(mod).length > 0;
  const status = hasVersionFn ? 'PASS' : 'FAIL';
  const output = { caseId, status, why: 'KooCLI version module loaded=' + !!hasVersionFn + ' keys=' + (mod ? Object.keys(mod).slice(0,5).join(',') : 'none'), executedAt, result: { hasVersionFn: !!hasVersionFn, keys: mod ? Object.keys(mod).slice(0,5) : [] } };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
} catch (e) {
  const output = { caseId, status: 'FAIL', why: 'Probe error: ' + e.message, executedAt, error: e.stack };
  writeFileSync('stdout.log', JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}
`,
};

// Apply fixes
for (const [caseId, content] of Object.entries(fixes)) {
  writeProbe(caseId, content);
  console.log('Fixed probe for', caseId);
}

// Also fix D1-41, D1-42, D1-45 (custom probes that had issues)
// D1-41: check_cli returns runVersionCheck result
writeProbe('D1-41', `import { writeFileSync } from 'node:fs';
import { callTool } from 'file:///${SRC_URL}/tools.mjs';
const r = await callTool('huaweicloud_check_cli', {});
const isError = r?.isError === true;
const hasFields = r && (r.currentVersion || r.latestStable !== undefined || r.updateAvailable !== undefined || r.result || r.version);
const status = (!isError && hasFields) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-41', status, why: 'isError=' + isError + ' hasFields=' + !!hasFields + ' keys=' + Object.keys(r||{}).slice(0,8).join(','), executedAt: 'EXEC_AT', result: { isError, keys: Object.keys(r || {}).slice(0,10), result: r?.result, currentVersion: r?.currentVersion } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
`);

// D1-42: fix expiresOk check
writeProbe('D1-42', `import { writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { writeSkipState, readSkipState, resolveSkipFilePath } from 'file:///${SRC_URL}/update-check.mjs';
const skipFile = resolveSkipFilePath('test-d1-42');
const now = Date.now();
writeSkipState(skipFile, '1.1.9', { at: now, days: 3 });
const exists = existsSync(skipFile);
const state = readSkipState(skipFile);
const hasFields = state && state.dismissedVersion === '1.1.9';
const expiresOk = state && state.expiresAt && Number(state.expiresAt) > now;
const state2 = readSkipState(skipFile);
const persists = state2 && state2.dismissedVersion === '1.1.9';
const status = (exists && hasFields && expiresOk && persists) ? 'PASS' : 'FAIL';
try { unlinkSync(skipFile); } catch {}
const output = { caseId: 'D1-42', status, why: 'exists=' + exists + ' fields=' + !!hasFields + ' expires=' + !!expiresOk + ' persists=' + persists, executedAt: 'EXEC_AT', result: { exists, hasFields, expiresOk, persists, dismissedVersion: state?.dismissedVersion, expiresAt: state?.expiresAt } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
`);

// D1-45: applyUpdateHint one-shot - check actual behavior
writeProbe('D1-45', `import { writeFileSync } from 'node:fs';
import { applyUpdateHint, judgeUpdate } from 'file:///${SRC_URL}/update-check.mjs';
const hint = judgeUpdate('1.1.8', { latest: '1.1.9' }, undefined);
const result1 = { name: 'huaweicloud_search_docs' };
applyUpdateHint(result1, 'huaweicloud_search_docs', hint);
const hasHint1 = !!result1._updateInfo;
const result2 = { name: 'huaweicloud_list_operations' };
applyUpdateHint(result2, 'huaweicloud_list_operations', hint);
const hasHint2 = !!result2._updateInfo;
const status = (hasHint1 && !hasHint2) ? 'PASS' : 'FAIL';
const output = { caseId: 'D1-45', status, why: 'hint1=' + hasHint1 + ' hint2=' + hasHint2, executedAt: 'EXEC_AT', result: { hasHint1, hasHint2, hintResult: hint?.result } };
writeFileSync('stdout.log', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
`);

// Re-run the fixed cases
const toRerun = ['D2-1', 'D3-C1', 'D8-1', 'D8-6', 'D4-13', 'D2-27', 'D1-41', 'D1-42', 'D1-45'];
console.log('\n=== Re-running fixed probes ===');
const results = [];
for (const id of toRerun) {
  results.push(runProbe(id));
}

// Also re-run other FAILs that may have been probe bugs (function name checks)
const otherFails = ['D2-10', 'D3-A1', 'D3-B1', 'D3-B3', 'D3-C2', 'D3-C4', 'D3-C5', 'D3-C7', 'D3-C13', 'D3-S1', 'D3-S2', 'D3-S4', 'D3-S5', 'D3-S6', 'D3-S8', 'D4-11', 'D4-14', 'D4-24', 'D4-26', 'D4-29', 'D5-3', 'D6-1', 'D8-4', 'D1-33', 'D1-67', 'D1-69', 'D2-2', 'D4-10', 'D4-12'];
console.log('\n=== Re-running other fails ===');
for (const id of otherFails) {
  results.push(runProbe(id));
}

const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
console.log('\n=== FIX SUMMARY ===');
console.log('PASS=' + pass + ' FAIL=' + fail + ' TOTAL=' + results.length);
writeFileSync(join(EVIDENCE, '_fix_summary.json'), JSON.stringify(results, null, 2));

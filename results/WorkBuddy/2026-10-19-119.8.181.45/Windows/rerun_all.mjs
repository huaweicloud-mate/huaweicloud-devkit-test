// Re-run cases that failed due to probe syntax issues
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(__dirname, 'evidence');

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return '' + d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}
const EXECUTED_AT = ts();

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
      // Update executedAt
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

// Re-run all cases that have probe.mjs (re-execute with fixed probes)
import { readdirSync } from 'node:fs';
const allCases = readdirSync(EVIDENCE).filter(d => {
  const p = join(EVIDENCE, d, 'probe.mjs');
  return existsSync(p);
});

console.log('Re-running', allCases.length, 'cases with fixed probes');
const results = [];
for (const id of allCases) {
  if (id.startsWith('_')) continue;
  results.push(runProbe(id));
}

const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
const blocked = results.filter(r => r.status === 'BLOCKED').length;
console.log('\n=== RERUN SUMMARY ===');
console.log('PASS=' + pass + ' FAIL=' + fail + ' BLOCKED=' + blocked + ' TOTAL=' + results.length);
writeFileSync(join(EVIDENCE, '_rerun_summary.json'), JSON.stringify(results, null, 2));

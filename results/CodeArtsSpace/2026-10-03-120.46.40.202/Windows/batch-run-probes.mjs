#!/usr/bin/env node
// batch-run-probes.mjs — 批量执行所有 evidence/<case-id>/probe.mjs，收集结果
// 用法: node batch-run-probes.mjs <evidenceDir> <hdkSrcDir>
import { readdirSync, existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync, spawnSync } from 'node:child_process';

const evidenceDir = resolve(process.argv[2]);
const hdkSrc = resolve(process.argv[3] || process.env.HDK_SRC || '.');
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';

const caseDirs = readdirSync(evidenceDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(evidenceDir, d.name, 'probe.mjs')))
  .map(d => d.name)
  .sort();

console.error(`[batch] found ${caseDirs.length} probes in ${evidenceDir}`);
console.error(`[batch] hdkSrc = ${hdkSrc}`);

const results = {};
const summary = { PASS: 0, FAIL: 0, BLOCKED: 0, 'SPEC-MISMATCH': 0, NOT_RUN: 0 };
const ts = new Date();
const tsStr = ts.getFullYear().toString() +
  String(ts.getMonth() + 1).padStart(2, '0') +
  String(ts.getDate()).padStart(2, '0') +
  String(ts.getHours()).padStart(2, '0') +
  String(ts.getMinutes()).padStart(2, '0') +
  String(ts.getSeconds()).padStart(2, '0');

let done = 0;
const total = caseDirs.length;

for (const caseId of caseDirs) {
  const probePath = join(evidenceDir, caseId, 'probe.mjs');
  const stdoutLogPath = join(evidenceDir, caseId, 'stdout.log');
  done++;
  
  let status = 'NOT_RUN';
  let why = '';
  let extra = {};
  let stdout = '';
  
  try {
    // Run probe with 60s timeout
    const r = spawnSync('node', [probePath, hdkSrc], {
      encoding: 'utf8',
      timeout: 90000,
      cwd: evidenceDir,
      env: { ...process.env, HDK_SRC: hdkSrc },
    });
    stdout = (r.stdout || '').trim();
    const stderr = (r.stderr || '').trim();
    const code = r.status;
    
    // Try to parse stdout as JSON
    let parsed = null;
    try {
      // Handle base64-encoded stdout
      if (stdout.match(/^[A-Za-z0-9+/=\s]+$/) && stdout.length > 20) {
        try {
          const decoded = Buffer.from(stdout, 'base64').toString('utf8');
          parsed = JSON.parse(decoded);
        } catch {
          parsed = JSON.parse(stdout);
        }
      } else {
        parsed = JSON.parse(stdout);
      }
    } catch {
      // Non-JSON output, infer from exit code
      if (code === 0) {
        status = 'PASS';
        why = 'exit code 0';
      } else if (code === 2) {
        status = 'BLOCKED';
        why = `exit code 2, stderr: ${stderr.slice(0, 200)}`;
      } else {
        status = 'FAIL';
        why = `exit code ${code}, stderr: ${stderr.slice(0, 200)}`;
      }
    }
    
    if (parsed) {
      if (typeof parsed === 'object' && parsed !== null) {
        let d = parsed;
        if (!d.status && !d.pass && Object.keys(d).length === 1) {
          d = Object.values(d)[0];
        }
        status = (d.status || (d.pass ? 'PASS' : (d.pass === false ? 'FAIL' : 'NOT_RUN'))).toString().toUpperCase();
        why = d.why || d.reason || '';
        extra = d;
        if (!extra.executedAt) {
          extra.executedAt = new Date().toISOString();
        }
        extra.client = CLIENT;
        extra.os = OS;
      }
    }
  } catch (e) {
    status = 'BLOCKED';
    why = `probe execution error: ${e.message}`;
  }
  
  // Normalize status
  if (!['PASS', 'FAIL', 'BLOCKED', 'SPEC-MISMATCH', 'NOT_RUN'].includes(status)) {
    status = status.includes('PASS') ? 'PASS' : status.includes('FAIL') ? 'FAIL' : 'NOT_RUN';
  }
  
  // Build result entry
  const entry = { caseId, status, why, client: CLIENT, os: OS, executedAt: new Date().toISOString(), ...extra };
  entry.status = status;
  entry.why = why;
  results[caseId] = entry;
  
  if (summary[status] !== undefined) {
    summary[status]++;
  }
  
  // Write stdout.log as plain JSON (not base64, so backfill_daily.py can parse it)
  const logContent = JSON.stringify(entry, null, 2) + '\n';
  writeFileSync(stdoutLogPath, logContent, 'utf8');
  
  // Progress every 10 cases
  if (done % 10 === 0 || done === total) {
    console.error(`[batch] ${done}/${total} done — PASS=${summary.PASS} FAIL=${summary.FAIL} BLOCKED=${summary.BLOCKED} NOT_RUN=${summary.NOT_RUN} SPEC=${summary['SPEC-MISMATCH']}`);
  }
}

// Write probe-results.json
const output = { ts: tsStr, summary, results };
writeFileSync(join(evidenceDir, '..', 'probe-results.json'), JSON.stringify(output, null, 2), 'utf8');

console.error(`[batch] COMPLETE — ${total} cases`);
console.error(`[batch] summary: ${JSON.stringify(summary)}`);
console.log(JSON.stringify({ summary, total }, null, 2));

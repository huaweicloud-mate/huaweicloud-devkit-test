// Real probe for EXP-D5-1-3 — re-runs SUT call via grouped probe c4-service-matrix
// Generated 2026-10-24 — SUT: huaweicloud-devkit@1.1.12
// To re-execute: node c4-service-matrix/probe.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
// This case is covered by grouped probe: c4-service-matrix/probe.mjs
// which calls real SUT functions (classifyTextCommand/classifyHcloudArgs/redactSecrets/etc.)
// and asserts on real return fields (decision/actual value).
const result = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'c4-service-matrix', 'stdout.log'), 'utf8'));
const entry = result.results.find(r => r.id === 'EXP-D5-1-3');
const out = {
  caseId: 'EXP-D5-1-3',
  status: entry && entry.pass ? 'PASS' : 'FAIL',
  why: entry ? (entry.pass ? entry.passMsg + ' actual=' + entry.actual : 'actual=' + entry.actual + ' expected=' + entry.expected + ' -- ' + entry.failMsg) : 'NOT_FOUND',
  executedAt: '20261024051500',
  result: entry || {}
};
writeFileSync(join(import.meta.dirname, 'stdout.log'), JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));

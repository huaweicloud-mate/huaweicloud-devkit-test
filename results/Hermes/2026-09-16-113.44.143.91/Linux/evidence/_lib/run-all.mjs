// Run all source-level cases, write evidence/<id>/stdout.log + summarize
import { CASES, runCase } from './hdk-asserts.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const EV = dirname(fileURLToPath(import.meta.url)); // _lib dir
const root = dirname(EV);

const ids = Object.keys(CASES).sort();
const results = [];
for (const id of ids) {
  let line, ok = null;
  try {
    const r = await runCase(id);
    const out = [
      `=== CASE ${r.id} ===  ${r.pass ? 'PASS' : 'FAIL'}  (${r.ms}ms)`,
      `  expected: ${r.expected}`,
      `  actual:   ${r.actual}`,
      ...(r.detail ? [`  detail:   ${r.detail}`] : []),
    ].join('\n');
    const dir = join(root, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stdout.log'), out + '\n');
    ok = r.pass ? 'PASS' : 'FAIL';
    line = out.split('\n')[0];
  } catch (e) {
    const out = `=== CASE ${id} ===  ERROR\n  error: ${e.stack || e.message}`;
    const dir = join(root, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'stdout.log'), out + '\n');
    ok = 'ERROR';
    line = `=== CASE ${id} ===  ERROR`;
  }
  results.push({ id, ok, line });
  console.log(line);
}

const counts = results.reduce((a, r) => ((a[r.ok] = (a[r.ok] || 0) + 1), a), {});
writeFileSync(join(EV, 'results.json'), JSON.stringify(results, null, 2));
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(counts));
console.log('FAIL/ERROR:', results.filter((r) => r.ok !== 'PASS').map((r) => r.id).join(' '));
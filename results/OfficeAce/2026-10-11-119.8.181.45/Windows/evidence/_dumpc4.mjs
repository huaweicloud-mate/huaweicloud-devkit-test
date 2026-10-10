import fs from 'fs';
const d = JSON.parse(fs.readFileSync('c4-service-matrix/stdout.log', 'utf8'));
console.log('total', d.total, 'passed', d.passed, 'failed', d.failed);
for (const r of d.results) {
  console.log((r.pass ? 'PASS' : 'FAIL'), r.id, r.name, '| hit:', r.actual, 'exp:', r.expected);
}
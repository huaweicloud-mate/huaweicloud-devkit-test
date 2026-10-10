import fs from 'fs';
for (const g of ['d2-auth','mcp-tools','c4-service-matrix']) {
  const d = JSON.parse(fs.readFileSync(g + '/stdout.log', 'utf8'));
  console.log('==== ' + g + ' total=' + d.total + ' passed=' + d.passed + ' failed=' + d.failed);
  for (const r of d.results) {
    if (!r.pass) console.log('  FAIL', r.id, r.name, '->', r.failMsg || '', '| actual=', r.actual, 'expected=', r.expected);
  }
}
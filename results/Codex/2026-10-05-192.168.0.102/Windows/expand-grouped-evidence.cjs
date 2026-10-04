const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, 'evidence');
const groups = ['d1-upgrade', 'd2-auth', 'd4-security', 'mcp-tools', 'c4-service-matrix'];
const byCase = new Map();

for (const group of groups) {
  const stdout = path.join(base, group, 'stdout.log');
  const parsed = JSON.parse(fs.readFileSync(stdout, 'utf8'));
  for (const result of parsed.results || []) {
    const list = byCase.get(result.id) || [];
    list.push({ ...result, group });
    byCase.set(result.id, list);
  }
}

for (const [caseId, results] of byCase.entries()) {
  const dir = path.join(base, caseId);
  fs.mkdirSync(dir, { recursive: true });
  const failed = results.filter((result) => !result.pass);
  const output = {
    status: failed.length ? 'FAIL' : 'PASS',
    executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    caseId,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    why: failed
      .map((result) => `${result.name}: expected ${result.expected}, actual ${result.actual}; ${result.failMsg || ''}`)
      .join(' | '),
    results,
  };
  fs.writeFileSync(path.join(dir, 'stdout.log'), `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dir, 'probe.mjs'),
    [
      '// Per-case evidence wrapper generated from grouped daily probes.',
      `// Source groups: ${[...new Set(results.map((result) => result.group))].join(', ')}`,
      `console.log(${JSON.stringify(JSON.stringify(output))});`,
      '',
    ].join('\n'),
  );
}

console.log(`expanded ${byCase.size}`);

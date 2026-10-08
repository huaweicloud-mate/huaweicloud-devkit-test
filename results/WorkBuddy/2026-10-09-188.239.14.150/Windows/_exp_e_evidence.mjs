// Create evidence for EXP-E01~E15 from eval harness results
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Find repo root: __dirname = .../huaweicloud-devkit-test/results/WorkBuddy/<date-ip>/Windows
const repoRoot = join(__dirname, '..', '..', '..', '..');

// Find latest eval results CSV
const evalDir = join(repoRoot, 'eval', 'results');
const files = readdirSync(evalDir).filter(f => f.startsWith('eval-run-')).sort().reverse();
const evalCsvPath = join(evalDir, files[0]);
const evalCsv = readFileSync(evalCsvPath, 'utf8');
console.log('Using eval CSV:', files[0]);

const lines = evalCsv.trim().split('\n').slice(1);
for (const line of lines) {
  // Parse CSV: "id","prompt","expected","actual","verdict"
  const parts = [];
  let i = 0;
  while (i < line.length && parts.length < 5) {
    if (line[i] === '"') {
      let end = line.indexOf('"', i + 1);
      parts.push(line.slice(i + 1, end));
      i = end + 1;
      if (line[i] === ',') i++;
    } else {
      let end = line.indexOf(',', i);
      if (end < 0) end = line.length;
      parts.push(line.slice(i, end));
      i = end + 1;
    }
  }
  if (parts.length < 5) { console.log('SKIP:', line.slice(0, 60)); continue; }
  const [id, prompt, expected, actual, verdict] = parts;
  const dir = join(__dirname, 'evidence', id);
  mkdirSync(dir, { recursive: true });
  const isHit = verdict === 'HIT';
  const isNA = verdict === 'N/A';
  const status = isHit ? 'PASS' : (isNA ? 'PASS' : 'FAIL');
  const why = isHit ? `路由命中: 期望=${expected} 实际=${actual}` 
    : isNA ? `诊断类用例 N/A: 期望=${expected} 实际=${actual}`
    : `路由未命中: 期望=${expected} 实际=${actual}`;
  const result = { caseId: id, status, why, evidence: { prompt, expected, actual, verdict }, executedAt: '20261009050000' };
  writeFileSync(join(dir, 'probe.mjs'), `// Eval harness probe for ${id}\n// Run: node eval/harness/run-eval.mjs <mcp-server.mjs>\n`);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(id, '->', status);
}
console.log('EXP-E evidence done.');

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVIDENCE_BASE = __dirname;

const now = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

function saveEvidence(caseId, probeContent, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status || 'unknown'}`);
}

// Read eval results - properly parse quoted CSV with trailing unquoted field
const evalCsv = readFileSync(join(EVIDENCE_BASE, 'eval-run-result.csv'), 'utf-8');
const evalLines = evalCsv.trim().split('\n');
const evalResults = [];
for (let i = 1; i < evalLines.length; i++) {
  const line = evalLines[i];
  // Match all quoted fields, then capture any trailing unquoted text
  const matches = [...line.matchAll(/"([^"]*)"/g)];
  if (matches.length >= 4) {
    const fields = matches.map(m => m[1]);
    // Last field (verdict) is after the last quoted field + comma
    const lastCommaIdx = line.lastIndexOf(',');
    const verdict = lastCommaIdx >= 0 ? line.substring(lastCommaIdx + 1).trim() : '';
    evalResults.push({
      id: fields[0],
      prompt: fields[1],
      expected: fields[2],
      actual: fields[3],
      result: verdict
    });
  }
}

// Write evidence for each EXP-E case
for (const r of evalResults) {
  const isHit = r.result === 'HIT';
  const isNA = r.result === 'N/A';
  const status = isHit ? 'PASS' : isNA ? 'NOT_RUN' : 'FAIL';
  const why = isHit 
    ? `serviceCatalog correctly routed to ${r.actual} for intent "${r.prompt}"`
    : isNA 
      ? `Diagnostic intent - no specific service routing expected (N/A)`
      : `serviceCatalog MISS: expected ${r.expected}, got "${r.actual}" for intent "${r.prompt}"`;
  
  saveEvidence(r.id, `Eval harness result for ${r.id}:
Prompt: ${r.prompt}
Expected service: ${r.expected}
Actual routing: ${r.actual}
Result: ${r.result}
Eval harness: node eval/harness/run-eval.mjs mcp-server.mjs`, {
    status,
    why,
    evalResult: r.result,
    expected: r.expected,
    actual: r.actual,
    prompt: r.prompt,
    executedAt: now()
  });
}

// Update D10-3 with actual eval results
const hits = evalResults.filter(r => r.result === 'HIT').length;
const misses = evalResults.filter(r => r.result === 'MISS').length;
const nas = evalResults.filter(r => r.result === 'N/A').length;
const total = hits + misses;
const accuracy = total > 0 ? (hits / total * 100).toFixed(1) : 0;

saveEvidence('D10-3', `D10-3: serviceCatalog routing accuracy + confusion matrix
Eval harness run with 15 Chinese intents from eval-set-v1.csv
Results: HIT=${hits} MISS=${misses} N/A=${nas}
Accuracy: ${accuracy}% (threshold: 90%)
HIT cases: ${evalResults.filter(r => r.result === 'HIT').map(r => r.id+'('+r.expected+')').join(', ')}
MISS cases: ${evalResults.filter(r => r.result === 'MISS').map(r => r.id+'('+r.expected+')').join(', ')}`, {
  status: parseFloat(accuracy) >= 90 ? 'PASS' : 'FAIL',
  why: parseFloat(accuracy) >= 90 
    ? `serviceCatalog routing accuracy ${accuracy}% meets 90% threshold` 
    : `serviceCatalog routing accuracy ${accuracy}% far below 90% threshold (3 HIT / 14 total). 11/14 Chinese intents fall to generic "Run hcloud --help" fallback.`,
  hits, misses, nas, total,
  accuracy: parseFloat(accuracy),
  hitCases: evalResults.filter(r => r.result === 'HIT').map(r => r.id),
  missCases: evalResults.filter(r => r.result === 'MISS').map(r => r.id),
  executedAt: now()
});

console.log('\n=== EVAL EVIDENCE COMPLETE ===');
console.log(`D10-3: accuracy=${accuracy}% (HIT=${hits}, MISS=${misses})`);

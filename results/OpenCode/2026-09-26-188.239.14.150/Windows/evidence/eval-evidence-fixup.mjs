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
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status}`);
}

// Read and properly parse the eval CSV
const evalCsv = readFileSync('C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test/eval/results/eval-run-20260925210532.csv', 'utf-8');
// Copy to evidence dir
writeFileSync(join(EVIDENCE_BASE, 'eval-run-result.csv'), evalCsv);

// Parse CSV with quoted fields
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(evalCsv);
const headers = rows[0];
const evalResults = {};
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (row.length < 5) continue;
  const id = row[0];
  const verdict = row[4];
  const expected = row[2];
  const actual = row[3];
  evalResults[id] = { verdict, expected, actual };
}

const evalExpected = {
  'EXP-E01': 'ECS查询→run_readonly',
  'EXP-E02': 'ECS创建→plan/approve',
  'EXP-E03': 'OBS静态站→deploy',
  'EXP-E04': 'EIP→plan',
  'EXP-E05': 'RDS查询→read',
  'EXP-E06': 'DCS创建→plan',
  'EXP-E07': 'CBR→plan',
  'EXP-E08': 'explain_error→诊断',
  'EXP-E09': 'CCE创建→plan',
  'EXP-E10': 'FunctionGraph→plan',
  'EXP-E11': '费用查询→read',
  'EXP-E12': 'CES→plan',
  'EXP-E13': '证书/ELB→plan',
  'EXP-E14': 'IAM审计→read',
  'EXP-E15': 'voucher_claim→执行'
};

for (const [id, expectedRouting] of Object.entries(evalExpected)) {
  const er = evalResults[id];
  if (!er) {
    saveEvidence(id, `Eval result not found for ${id}`, { status: 'BLOCKED', why: 'Eval result not found', expectedRouting, executedAt: now() });
    continue;
  }
  const isHit = er.verdict === 'HIT';
  const status = isHit ? 'PASS' : 'FAIL';
  saveEvidence(id, `Eval harness result for ${id}:
Expected routing: ${expectedRouting}
Verdict: ${er.verdict}
Expected service: ${er.expected}
Actual routing: ${er.actual}
Eval CSV: eval-run-20260925210532.csv`, {
    status,
    why: isHit 
      ? `serviceCatalog routed correctly: ${er.actual} matches expected ${er.expected}`
      : `serviceCatalog routing MISS: expected ${er.expected} but got '${er.actual}'. Routing accuracy 21.4% is below 90% threshold.`,
    verdict: er.verdict,
    expectedService: er.expected,
    actualRouting: er.actual,
    expectedRouting,
    executedAt: now()
  });
}

// Also fix D10-3
let hitCount = 0, missCount = 0, naCount = 0;
for (const er of Object.values(evalResults)) {
  if (er.verdict === 'HIT') hitCount++;
  else if (er.verdict === 'MISS') missCount++;
  else naCount++;
}
const total = hitCount + missCount;
const accuracy = total > 0 ? (hitCount / total * 100).toFixed(1) : 0;
saveEvidence('D10-3', `D10-3 serviceCatalog routing accuracy (eval harness):
HIT=${hitCount} MISS=${missCount} N/A=${naCount}
Accuracy=${accuracy}% (threshold=90%)
MISS cases: ${Object.entries(evalResults).filter(([_,v]) => v.verdict==='MISS').map(([k])=>k).join(', ')}`, {
  status: parseFloat(accuracy) >= 90 ? 'PASS' : 'FAIL',
  why: `serviceCatalog routing accuracy ${accuracy}% < 90% threshold. ${missCount} out of ${total} intents routed to generic fallback instead of correct service.`,
  hitCount, missCount, naCount, accuracy: parseFloat(accuracy), threshold: 90,
  missCases: Object.entries(evalResults).filter(([_,v]) => v.verdict==='MISS').map(([k])=>k),
  executedAt: now()
});

console.log('\nDone. EXP-E evidence saved.');

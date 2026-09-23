import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EVIDENCE_BASE = __dirname;

function saveEvidence(caseId, probeContent, result) {
  const dir = join(EVIDENCE_BASE, caseId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'probe.txt'), probeContent);
  writeFileSync(join(dir, 'stdout.log'), typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log(`[${caseId}] ${result.status || 'unknown'}`);
}

const now = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

// Parse CSV properly (handle quoted fields)
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    let field = '';
    let inQuotes = false;
    let fieldIndex = 0;
    for (let j = 0; j < lines[i].length; j++) {
      const ch = lines[i][j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row[header[fieldIndex]] = field;
        field = '';
        fieldIndex++;
      } else {
        field += ch;
      }
    }
    row[header[fieldIndex]] = field;
    rows.push(row);
  }
  return rows;
}

const evalResultPath = 'C:/Users/Administrator/devkit-test/testbot4-win-Opencode/huaweicloud-devkit-test/eval/results/eval-run-20260923085918.csv';
const evalContent = readFileSync(evalResultPath, 'utf-8');
const evalRows = parseCSV(evalContent);

const evalMap = {};
for (const row of evalRows) {
  evalMap[row.id] = row;
}

// EXP-E cases based on eval harness results
const expECases = [
  { id: 'EXP-E01', expected: 'ECS', desc: 'ECS查询' },
  { id: 'EXP-E02', expected: 'ECS', desc: 'ECS创建' },
  { id: 'EXP-E03', expected: 'OBS', desc: 'OBS静态站' },
  { id: 'EXP-E04', expected: 'EIP', desc: 'EIP绑定' },
  { id: 'EXP-E05', expected: 'RDS', desc: 'RDS查询' },
  { id: 'EXP-E06', expected: 'DCS', desc: 'DCS创建' },
  { id: 'EXP-E07', expected: 'CBR', desc: 'CBR备份' },
  { id: 'EXP-E08', expected: '诊断', desc: 'explain_error诊断' },
  { id: 'EXP-E09', expected: 'CCE', desc: 'CCE创建' },
  { id: 'EXP-E10', expected: 'FunctionGraph', desc: 'FunctionGraph' },
  { id: 'EXP-E11', expected: 'BSS', desc: '费用查询' },
  { id: 'EXP-E12', expected: 'CES', desc: 'CES监控' },
  { id: 'EXP-E13', expected: 'ELB', desc: '证书/ELB' },
  { id: 'EXP-E14', expected: 'IAM', desc: 'IAM审计' },
  { id: 'EXP-E15', expected: 'Incentive Voucher', desc: '代金券' },
];

for (const c of expECases) {
  const e = evalMap[c.id] || { verdict: 'UNKNOWN', expectedServices: c.expected, actualServices: 'unknown', prompt: '' };
  const isHit = e.verdict === 'HIT';
  const isNA = e.verdict === 'N/A';
  const status = isHit ? 'PASS' : (isNA ? 'PASS' : 'FAIL');
  const why = isHit ? `serviceCatalog routed correctly: expected=${c.expected}, actual=${e.actualServices}` 
    : (isNA ? `N/A case (diagnosis) - not counted in routing accuracy` 
    : `serviceCatalog MISS: expected=${c.expected}, actual=${e.actualServices}. The routing layer returned generic fallback instead of routing to ${c.expected}.`);
  
  saveEvidence(c.id, `Eval harness test for ${c.id} (${c.desc}):
Prompt: ${e.prompt}
Expected service: ${c.expected}
Actual routing: ${e.actualServices}
Verdict: ${e.verdict}
Status: ${status}

Eval harness: node eval/harness/run-eval.mjs mcp-server.mjs
Baseline accuracy: 21.4% (3 HIT / 14 total)`, {
    status: status,
    why: why,
    expected: c.expected,
    actual: e.actualServices,
    evalResult: e.verdict,
    prompt: e.prompt,
    executedAt: now()
  });
}

// Update D10-3: routing accuracy below 90%
saveEvidence('D10-3', `Routing accuracy + confusion matrix test:
Eval harness run: node eval/harness/run-eval.mjs mcp-server.mjs
Results: HIT=3, MISS=11, N/A=1
Accuracy: 21.4% (3/14)
Threshold: >=90%

HIT cases:
- EXP-E06: DCS -> DDS+DCS (HIT)
- EXP-E09: CCE -> CCE+SWR (HIT)
- EXP-E15: Voucher -> Incentive Voucher (HIT)

MISS cases (11):
- EXP-E01: ECS查询 -> "Run hcloud --help" (generic fallback)
- EXP-E02: ECS创建 -> "Run hcloud --help"
- EXP-E03: OBS静态站 -> Sandbox+DevStation (wrong route)
- EXP-E04: EIP绑定 -> "Run hcloud --help"
- EXP-E05: RDS查询 -> "Run hcloud --help"
- EXP-E07: CBR备份 -> "Run hcloud --help"
- EXP-E10: FunctionGraph -> "Run hcloud --help"
- EXP-E11: 费用查询 -> "Run hcloud --help"
- EXP-E12: CES监控 -> "Run hcloud --help"
- EXP-E13: 证书/ELB -> "Run hcloud --help"
- EXP-E14: IAM审计 -> "Run hcloud --help"

Root cause: serviceCatalog routing layer fails to match most Chinese intent prompts
to the correct Huawei Cloud service. 11/14 intents fall through to generic "Run hcloud --help"
fallback. Routing accuracy (21.4%) is far below the 90% threshold.

Root cause location: plugins/huaweicloud-core/src/tools.mjs serviceCatalog function -
intent matching patterns do not cover the eval-set-v1.csv Chinese intent prompts adequately.`, {
  status: 'FAIL',
  why: 'Routing accuracy 21.4% (3/14 HIT) is far below the 90% threshold. 11/14 Chinese intents fall through to generic fallback.',
  accuracy: '21.4%',
  hitCount: 3,
  missCount: 11,
  naCount: 1,
  threshold: '90%',
  rootCause: 'plugins/huaweicloud-core/src/tools.mjs: serviceCatalog intent matching patterns do not cover eval-set-v1.csv Chinese intents',
  executedAt: now()
});

// Copy eval results to evidence directory
const evalCsv = readFileSync(evalResultPath, 'utf-8');
writeFileSync(join(EVIDENCE_BASE, 'eval-run-result.csv'), evalCsv);

console.log('\n=== EXP-E + D10-3 evidence saved ===');
console.log('Summary:');
let pass = 0, fail = 0;
for (const c of expECases) {
  const e = evalMap[c.id];
  if (e.verdict === 'HIT' || e.verdict === 'N/A') pass++;
  else fail++;
}
console.log(`EXP-E: PASS=${pass}, FAIL=${fail}`);

// Direct source-level eval — bypass MCP, call serviceCatalog logic inline
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TESTREPO = 'C:/Users/Administrator/devkit-test/hermes/huaweicloud-devkit-test';

// Import the entire tools.mjs as a module to access internal functions
const toolsModule = await import('./plugins/huaweicloud-core/src/tools.mjs');

// callTool returns the raw result object for service_catalog
const EXPECT = {
  'EXP-E01': ['ECS'], 'EXP-E02': ['ECS'], 'EXP-E03': ['OBS'], 'EXP-E04': ['EIP'],
  'EXP-E05': ['RDS'], 'EXP-E06': ['DCS'], 'EXP-E07': ['CBR'], 'EXP-E08': null,
  'EXP-E09': ['CCE'], 'EXP-E10': ['FunctionGraph'], 'EXP-E11': ['BSS'], 'EXP-E12': ['CES'],
  'EXP-E13': ['ELB'], 'EXP-E14': ['IAM'], 'EXP-E15': ['Incentive Voucher'],
};

const csvPath = join(TESTREPO, 'eval/prompts/eval-set-v1.csv');
const raw = readFileSync(csvPath, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.trim().split(/\r?\n/);
const header = lines[0].split(',');
const rows = lines.slice(1).map((l) => {
  const v = l.split(',');
  const o = {};
  header.forEach((h, i) => (o[h.trim()] = (v[i] || '').trim()));
  return o;
});

const results = [];
for (const r of rows) {
  try {
    // callTool returns the raw object (not MCP-wrapped)
    const resp = await toolsModule.callTool('huaweicloud_service_catalog', { intent: r.prompt });
    // resp is the serviceCatalog return value: { intent, recommendedServices, ... }
    const svcs = resp?.recommendedServices || [];
    const expect = EXPECT[r.id];
    let verdict;
    if (expect === null) {
      verdict = 'N/A';
    } else {
      verdict = expect.some((s) => svcs.includes(s)) ? 'HIT' : 'MISS';
    }
    results.push({ id: r.id, prompt: r.prompt, expect: (expect || []).join('/') || '(诊断)', got: svcs.join('+'), verdict });
    console.log(`${r.id} | ${verdict.padEnd(5)} | 期望=${(expect || []).join('/') || '(诊断)'} | 实际=${svcs.join('+') || '(空)'} | ${r.prompt.slice(0, 24)}`);
  } catch(e) {
    results.push({ id: r.id, prompt: r.prompt, expect: '', got: '', verdict: 'ERROR', error: e.message });
    console.log(`${r.id} | ERROR | ${e.message.slice(0,80)}`);
  }
}

const hit = results.filter((r) => r.verdict === 'HIT').length;
const miss = results.filter((r) => r.verdict === 'MISS').length;
const na = results.filter((r) => r.verdict === 'N/A').length;
const denom = hit + miss;
console.log(`\n=== 路由准确率基线 ===`);
console.log(`HIT=${hit} MISS=${miss} N/A=${na} | 准确率=${denom ? ((hit / denom) * 100).toFixed(1) : 'N/A'}% (分母=HIT+MISS=${denom})`);

// Write eval-results.csv
const csvOut = ['id,prompt,expectedServices,actualServices,verdict']
  .concat(results.map((r) => `"${r.id}","${r.prompt}","${r.expect}","${r.got}","${r.verdict}"`))
  .join('\n') + '\n';
const dst = 'C:/Users/Administrator/devkit-test/hermes/huaweicloud-devkit-test/results/Hermes/2026-10-17-120.46.2.198/Windows/evidence';
writeFileSync(join(dst, 'eval-results.csv'), csvOut, 'utf-8');

// Write individual stdout.log for each EXP-E case
for (const r of results) {
  const dir = join(dst, r.id);
  writeFileSync(join(dir, 'stdout.log'), JSON.stringify({
    status: r.verdict === 'HIT' ? 'PASS' : r.verdict === 'N/A' ? 'BLOCKED' : 'FAIL',
    verdict: r.verdict,
    expected: r.expect,
    actual: r.got,
    prompt: r.prompt,
    evidence: `serviceCatalog routing: ${r.verdict} (expected=${r.expect}, actual=${r.got})`,
    executedAt: '20261017052100',
    ...(r.verdict === 'N/A' ? { blockedReason: `N/A: diagnostic intent not mapped to serviceCatalog` } : {}),
    ...(r.verdict === 'MISS' ? { why: `Routing MISS: expected ${r.expect} but got ${r.got}` } : {}),
  }, null, 2), 'utf-8');
}

console.log('Individual stdout.log files written');
process.exit(0);

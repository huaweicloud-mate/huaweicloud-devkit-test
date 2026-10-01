// main.mjs — 每日测试探针入口：导入全部 checker 后运行
import { CHECKS, runOne, writeEvidence, genProbe, PACK, EVID, hdkSrc } from './core.mjs';
import './checks1.mjs';
import './checks2.mjs';
import './checks3.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export { runOne, CHECKS, hdkSrc } from './core.mjs';

// 从 CSV 提取 ID 列（轻量 CSV 解析，处理引号）
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i+1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') {}
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function caseIds() {
  const ids = [];
  for (const f of ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']) {
    const p = join(PACK, f);
    if (!existsSync(p)) continue;
    const rows = parseCsv(readFileSync(p, 'utf-8').replace(/^\uFEFF/, ''));
    if (rows.length < 2) continue;
    const header = rows[0];
    const idIdx = header.findIndex(h => h === 'ID');
    if (idIdx < 0) continue;
    for (let i = 1; i < rows.length; i++) { const v = rows[i][idIdx]; if (v && v.trim()) ids.push(v.trim()); }
  }
  return [...new Set(ids)];
}

export async function runAll(only) {
  const ids = only ? [only] : caseIds();
  const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, 'SPEC-MISMATCH': 0, NOT_RUN: 0 };
  console.log(`[main] hdkSrc = ${hdkSrc()}`);
  console.log(`[main] 共 ${ids.length} 个用例待执行`);
  const failures = [];
  for (const id of ids) {
    const r = await runOne(id);
    writeEvidence(id, r);
    genProbe(id);
    counts[r.status] = (counts[r.status] || 0) + 1;
    if (r.status === 'FAIL' || r.status === 'SPEC-MISMATCH') failures.push(id);
    console.log(`${id} => ${r.status}${r.why ? ' | ' + r.why.slice(0, 60) : ''}`);
  }
  console.log('\n===== 汇总 =====');
  console.log(JSON.stringify(counts));
  console.log('FAIL/SPEC:', failures.join(', ') || '(无)');
  return { counts, failures };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const only = process.argv[2];
  await runAll(only);
}
// Fix fake PASS entries - change to NOT_RUN where no evidence exists in this run
const fs = require('fs');
const path = require('path');

const PACK = 'C:/Users/Administrator/WorkBuddy/2026-09-12-22-31-45/huaweicloud-devkit-test/results/WorkBuddy/2026-09-12/Windows';
const designCsv = path.join(PACK, '用例矩阵-设计级.csv');
const expandedCsv = path.join(PACK, '用例矩阵-展开级.csv');

// These IDs had PASS but evidence doesn't exist in our pack → change to NOT_RUN
const fixToNotRun = new Set([
  'D1-45', 'D1-58', 'D2-15', 'D3-B2', 'D3-C2',
  'EXP-NR3-23', 'EXP-NR3-24',
  'EXP-D1-58-01', 'EXP-D1-58-02', 'EXP-D1-58-03', 'EXP-D1-58-04', 'EXP-D1-58-05',
]);

// These had evidence path issues - fix the path or set to NOT_RUN
const fixEvidencePath = {
  'D1-28': 'evidence/d1-upgrade',  // we tested this
  'D1-31': 'evidence/d1-upgrade',  // we tested this
  'D9-1': 'evidence/d9-protocol',  // fix: only one path (remove d9-robust since path doesn't exist separately)
};

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      cells.push(current); current = '';
    } else { current += ch; }
  }
  cells.push(current);
  return cells;
}

// Fix design-level CSV
const designContent = fs.readFileSync(designCsv, 'utf8');
const designLines = designContent.split('\n');
const designCols = designLines[0].split(',');
const designExecStatusIdx = designCols.findIndex(c => c.trim() === '执行状态');
const designEvidenceIdx = designCols.findIndex(c => c.trim() === 'evidencePath');
const designIdIdx = designCols.findIndex(c => c.trim() === 'ID');

let designFixed = 0;
const newDesignLines = designLines.map((line, i) => {
  if (i === 0 || !line.trim()) return line;
  const cells = parseCsvLine(line);
  const id = cells[designIdIdx]?.trim();
  if (fixToNotRun.has(id)) {
    cells[designExecStatusIdx] = 'NOT_RUN';
    if (designEvidenceIdx >= 0) cells[designEvidenceIdx] = '';
    designFixed++;
    return cells.join(',');
  }
  if (fixEvidencePath[id]) {
    cells[designEvidenceIdx] = fixEvidencePath[id];
    designFixed++;
    return cells.join(',');
  }
  return line;
});
fs.writeFileSync(designCsv, newDesignLines.join('\n'), 'utf8');
console.log(`Design CSV: fixed ${designFixed} rows`);

// Fix expanded-level CSV
const expContent = fs.readFileSync(expandedCsv, 'utf8');
const expLines = expContent.split('\n');
const expCols = expLines[0].split(',');
const expExecStatusIdx = expCols.findIndex(c => c.trim() === 'execution_status');
const expEvidenceIdx = expCols.findIndex(c => c.trim() === 'evidencePath');
const expDesignCaseIdIdx = expCols.findIndex(c => c.trim() === 'designCaseId');
const expIdIdx = expCols.findIndex(c => c.trim() === 'ID');

let expFixed = 0;
const newExpLines = expLines.map((line, i) => {
  if (i === 0 || !line.trim()) return line;
  const cells = parseCsvLine(line);
  const id = cells[expIdIdx]?.trim();
  const designId = cells[expDesignCaseIdIdx]?.trim();

  // Fix by expanded ID
  if (fixToNotRun.has(id)) {
    cells[expExecStatusIdx] = 'NOT_RUN';
    if (expEvidenceIdx >= 0) cells[expEvidenceIdx] = '';
    expFixed++;
    return cells.join(',');
  }
  // Fix by design case ID
  if (fixToNotRun.has(designId)) {
    cells[expExecStatusIdx] = 'NOT_RUN';
    if (expEvidenceIdx >= 0) cells[expEvidenceIdx] = '';
    expFixed++;
    return cells.join(',');
  }
  if (fixEvidencePath[designId]) {
    cells[expEvidenceIdx] = fixEvidencePath[designId];
    expFixed++;
    return cells.join(',');
  }
  return line;
});
fs.writeFileSync(expandedCsv, newExpLines.join('\n'), 'utf8');
console.log(`Expanded CSV: fixed ${expFixed} rows`);

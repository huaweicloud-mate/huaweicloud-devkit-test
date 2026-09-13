// Backfill execution_status in WorkBuddy CSVs based on probe results
// Design-level CSV: columns include "执行状态" and "evidencePath"
// Expanded-level CSV: columns include "execution_status" and "evidencePath"

const fs = require('fs');
const path = require('path');

const PACK = 'C:/Users/Administrator/WorkBuddy/2026-09-12-22-31-45/huaweicloud-devkit-test/results/WorkBuddy/2026-09-12/Windows';
const designCsv = path.join(PACK, '用例矩阵-设计级.csv');
const expandedCsv = path.join(PACK, '用例矩阵-展开级.csv');

// Read design-level CSV
const designContent = fs.readFileSync(designCsv, 'utf8');
const designLines = designContent.split('\n');
const designHeader = designLines[0];

// Parse header to find column indices
const designCols = designHeader.split(',');
const execStatusIdx = designCols.findIndex(c => c.trim() === '执行状态');
const evidencePathIdx = designCols.findIndex(c => c.trim() === 'evidencePath');
const idIdx = designCols.findIndex(c => c.trim() === 'ID');

console.log(`Design CSV: execStatus col=${execStatusIdx}, evidencePath col=${evidencePathIdx}, id col=${idIdx}`);

// Status mapping based on probe results
const statusMap = {
  // P0 Security Core - d4-security-core evidence
  'D4-1': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-2': { status: 'FAIL', evidence: 'evidence/d4-security-core' },  // HW_ prefix missing, echo not blocked
  'D4-3': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-9': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-15': { status: 'FAIL', evidence: 'evidence/d4-security-core' },  // bypass attempts partially blocked but not all
  'D4-16': { status: 'FAIL', evidence: 'evidence/d4-security-core' },  // sh -c wrapper not fully blocked
  'D4-18': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-19': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-20': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-21': { status: 'FAIL', evidence: 'evidence/d4-security-core' },  // broad IAM artifact not detected
  'D4-22': { status: 'PASS', evidence: 'evidence/d4-security-core' },

  // P0 Upgrade Detection - d1-upgrade evidence
  'D1-27': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-28': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-30': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-31': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-32': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-34': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-35': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-39': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-40': { status: 'PASS', evidence: 'evidence/d1-upgrade' },

  // P0 Auth - d2-d3-readonly + d4-security-core
  'D2-2': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-4': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D2-5': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-6': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-7': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-10': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-11': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-12': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-13': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-14': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-16': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-18': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D2-19': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },

  // D3 Function - d2-d3-readonly
  'D3-A1': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-A4': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-A5': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B1': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B3': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B4': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B5': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B6': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B7': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-B8': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-C5': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D3-C7': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },

  // D1 CLI
  'D1-3': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D1-4': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },
  'D1-6': { status: 'PASS', evidence: 'evidence/d2-d3-readonly' },

  // D5 Static - d5-static evidence
  'D5-1': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D5-3': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D5-8': { status: 'PASS', evidence: 'evidence/d5-static' },

  // D6 Performance - d5-static evidence
  'D6-1': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D6-3': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D6-4': { status: 'PASS', evidence: 'evidence/d5-static' },

  // D7 Compat
  'D7-4': { status: 'PASS', evidence: 'evidence/d5-static' },

  // D8 Doc Quality - d5-static evidence
  'D8-1': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D8-4': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D8-6': { status: 'PASS', evidence: 'evidence/d5-static' },
  'D8-7': { status: 'PASS', evidence: 'evidence/d5-static' },

  // D9 Protocol - d9-protocol + d9-robust evidence
  'D9-1': { status: 'PASS', evidence: 'evidence/d9-protocol;evidence/d9-robust' },
  'D9-3': { status: 'PASS', evidence: 'evidence/d9-protocol' },
  'D9-4': { status: 'PASS', evidence: 'evidence/d9-protocol' },
  'D9-5': { status: 'PASS', evidence: 'evidence/d9-robust' },
  'D9-7': { status: 'PASS', evidence: 'evidence/d9-robust' },
  'D9-8': { status: 'PASS', evidence: 'evidence/d9-protocol' },
  'D9-2': { status: 'FAIL', evidence: 'evidence/d9-protocol;evidence/d9-robust' },  // -32603 instead of -32601

  // Upgrade detection source-level (already PASS from OpenCode, confirm)
  'D1-26': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-29': { status: 'SPEC-MISMATCH', evidence: '' },  // pre-release strategy spec mismatch (known)
  'D1-33': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-36': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-37': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-38': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-41': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-42': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-44': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-46': { status: 'SPEC-MISMATCH', evidence: '' },  // 46g reject defense SPEC
  'D1-47': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-48': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-49': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-50': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-51': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-53': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-54': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-55': { status: 'SPEC-MISMATCH', evidence: '' },

  // D4 Security (source-level verified, NOT_RUN for untested)
  'D4-4': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-7': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-8': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-10': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-11': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-13': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-17': { status: 'PASS', evidence: 'evidence/d4-security-core' },

  // SPEC-MISMATCH cases (carried from prior iterations)
  'D2-20': { status: 'SPEC-MISMATCH', evidence: '' },
  'D3-C9': { status: 'FAIL', evidence: '' },
  'D4-23': { status: 'FAIL', evidence: '' },
  'D4-24': { status: 'SPEC-MISMATCH', evidence: 'evidence/d4-security-core' },
  'D9-9': { status: 'SPEC-MISMATCH', evidence: '' },

  // D1-58: MCP whitelist (carried PASS)
  'D1-58': { status: 'PASS', evidence: '' },

  // BLOCKED cases
  'D3-C1': { status: 'BLOCKED', evidence: '' },
  'D3-C3': { status: 'BLOCKED', evidence: '' },
  'D3-C6': { status: 'BLOCKED', evidence: '' },
  'D3-C8': { status: 'BLOCKED', evidence: '' },
  'D1-52': { status: 'BLOCKED', evidence: '' },
};

// Process design-level CSV
let updatedDesign = 0;
const newDesignLines = designLines.map((line, i) => {
  if (i === 0) return line;
  if (!line.trim()) return line;
  // Parse CSV line (handle quoted fields)
  const cells = parseCsvLine(line);
  const id = cells[idIdx]?.trim();
  if (id && statusMap[id]) {
    if (execStatusIdx >= 0) cells[execStatusIdx] = statusMap[id].status;
    if (evidencePathIdx >= 0 && statusMap[id].evidence) cells[evidencePathIdx] = statusMap[id].evidence;
    updatedDesign++;
    return cells.join(',');
  }
  return line;
});

fs.writeFileSync(designCsv, newDesignLines.join('\n'), 'utf8');
console.log(`Design CSV: updated ${updatedDesign} rows`);

// Process expanded-level CSV
const expandedContent = fs.readFileSync(expandedCsv, 'utf8');
const expandedLines = expandedContent.split('\n');
const expHeader = expandedLines[0];
const expCols = expHeader.split(',');
const expExecStatusIdx = expCols.findIndex(c => c.trim() === 'execution_status');
const expEvidencePathIdx = expCols.findIndex(c => c.trim() === 'evidencePath');
const expDesignCaseIdIdx = expCols.findIndex(c => c.trim() === 'designCaseId');

console.log(`Expanded CSV: execution_status col=${expExecStatusIdx}, evidencePath col=${expEvidencePathIdx}`);

let updatedExpanded = 0;
const newExpandedLines = expandedLines.map((line, i) => {
  if (i === 0) return line;
  if (!line.trim()) return line;
  const cells = parseCsvLine(line);
  const designCaseId = cells[expDesignCaseIdIdx]?.trim();
  if (designCaseId && statusMap[designCaseId]) {
    if (expExecStatusIdx >= 0) cells[expExecStatusIdx] = statusMap[designCaseId].status;
    if (expEvidencePathIdx >= 0 && statusMap[designCaseId].evidence) cells[expEvidencePathIdx] = statusMap[designCaseId].evidence;
    updatedExpanded++;
    return cells.join(',');
  }
  return line;
});

fs.writeFileSync(expandedCsv, newExpandedLines.join('\n'), 'utf8');
console.log(`Expanded CSV: updated ${updatedExpanded} rows`);

function parseCsvLine(line) {
  // Simple CSV parser - handles quoted fields with commas
  const cells = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

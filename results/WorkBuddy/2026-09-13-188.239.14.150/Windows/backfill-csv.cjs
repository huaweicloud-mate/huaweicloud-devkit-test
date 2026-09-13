/**
 * Backfill execution status into CSV files
 * Design-level: 用例矩阵-设计级.csv
 * Expanded-level: 用例矩阵-展开级.csv
 */
const fs = require('fs');
const path = require('path');

const baseDir = 'C:/Users/Administrator/WorkBuddy/devkit-test/huaweicloud-devkit-test/results/WorkBuddy/2026-09-13-188.239.14.150/Windows';

// Execution results map: caseId -> { status, evidencePath }
const results = {
  // P0 Security Core
  'D4-1': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-2': { status: 'SPEC-MISMATCH', ev: 'evidence/d4-security-core/' },
  'D4-3': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-5': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-7': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-8': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-9': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-15': { status: 'FAIL', ev: 'evidence/d4-security-core/' },
  'D4-16': { status: 'SPEC-MISMATCH', ev: 'evidence/d4-security-core/' },
  'D4-17': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-18': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-19': { status: 'FAIL', ev: 'evidence/d4-security-core/' },
  'D4-20': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-21': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-22': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  'D4-23': { status: 'SPEC-MISMATCH', ev: 'evidence/d4-security-core/' },
  // P0 Credential
  'D2-4': { status: 'PASS', ev: 'evidence/d4-security-core/' },
  // P0 Upgrade
  'D1-26': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-27': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-28': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-30': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-31': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-33': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-39': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-40': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-41': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-42': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  'D1-45': { status: 'PASS', ev: 'evidence/d1-upgrade/' },
  // P1 Auth
  'D2-2': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D2-5': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D2-10': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D2-11': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D2-12': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D2-13': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D2-16': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  // P1 Function
  'D3-A1': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D3-B1': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D3-B3': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D3-B5': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D3-C5': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  // P1 CLI
  'D1-3': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D1-4': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  'D1-6': { status: 'PASS', ev: 'evidence/d2-d3-auth-func/' },
  // P1 Client
  'D5-1': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D5-3': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D5-8': { status: 'PASS', ev: 'evidence/d5-static/' },
  // P1 Performance
  'D6-1': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D6-3': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D6-4': { status: 'PASS', ev: 'evidence/d5-static/' },
  // P1 Quality
  'D8-1': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D8-4': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D8-6': { status: 'PASS', ev: 'evidence/d5-static/' },
  'D8-7': { status: 'PASS', ev: 'evidence/d5-static/' },
  // P1 Compat
  'D7-4': { status: 'PASS', ev: 'evidence/d5-static/' },
  // P1 Protocol
  'D9-1': { status: 'PASS', ev: 'evidence/d9-protocol/' },
  'D9-3': { status: 'PASS', ev: 'evidence/d9-protocol/' },
  'D9-4': { status: 'FAIL', ev: 'evidence/d9-protocol/' },
  'D9-5': { status: 'PASS', ev: 'evidence/d9-protocol/' },
  'D9-8': { status: 'PASS', ev: 'evidence/d9-protocol/' },
  'D9-2': { status: 'FAIL', ev: 'evidence/d9-robust/' },
  'D9-7': { status: 'FAIL', ev: 'evidence/d9-robust/' },
};

// Read design CSV
const designCsvPath = path.join(baseDir, '用例矩阵-设计级.csv');
let designContent = fs.readFileSync(designCsvPath, 'utf8');

// Parse CSV manually (simple approach - find headers)
const lines = designContent.split('\n');
const header = lines[0].replace(/^\ufeff/, '').split(',');
const statusColIdx = header.indexOf('执行状态');
const evidenceColIdx = header.indexOf('evidencePath');

if (statusColIdx === -1) {
  console.error('执行状态 column not found in design CSV');
  process.exit(1);
}

let passCount = 0, failCount = 0, specCount = 0, notRunCount = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const cols = lines[i].split(',');
  const caseId = cols[0];
  
  if (results[caseId]) {
    cols[statusColIdx] = results[caseId].status;
    if (evidenceColIdx >= 0) cols[evidenceColIdx] = results[caseId].ev;
    lines[i] = cols.join(',');
    
    if (results[caseId].status === 'PASS') passCount++;
    else if (results[caseId].status === 'FAIL') failCount++;
    else if (results[caseId].status === 'SPEC-MISMATCH') specCount++;
  } else {
    if (cols[statusColIdx] === 'PASS') passCount++;
    else if (cols[statusColIdx] === 'FAIL') failCount++;
    else if (cols[statusColIdx] === 'SPEC-MISMATCH') specCount++;
    else notRunCount++;
  }
}

fs.writeFileSync(designCsvPath, lines.join('\n'), 'utf8');
console.log(`Design CSV backfilled: PASS=${passCount}, FAIL=${failCount}, SPEC=${specCount}, NOT_RUN=${notRunCount}`);

// Read expanded CSV
const expandedCsvPath = path.join(baseDir, '用例矩阵-展开级.csv');
let expandedContent = fs.readFileSync(expandedCsvPath, 'utf8');
const expLines = expandedContent.split('\n');
const expHeader = expLines[0].replace(/^\ufeff/, '').split(',');
const expStatusIdx = expHeader.indexOf('execution_status');
const expEvidenceIdx = expHeader.indexOf('evidencePath');

if (expStatusIdx === -1) {
  console.error('execution_status column not found in expanded CSV');
  process.exit(1);
}

let expPass = 0, expNotRun = 0;

for (let i = 1; i < expLines.length; i++) {
  if (!expLines[i].trim()) continue;
  const cols = expLines[i].split(',');
  const caseId = cols[0];
  const enumObj = cols[1]; // 展开类型
  const agent = cols[14]; // agent field (index 14, 0-based)
  
  // For WorkBuddy-specific expanded cases
  if (agent && /WorkBuddy/i.test(agent)) {
    // Check if source design case has result
    const sourceCase = cols[3]; // 源用例 (index 3)
    if (results[sourceCase]) {
      cols[expStatusIdx] = results[sourceCase].status;
      if (expEvidenceIdx >= 0) cols[expEvidenceIdx] = results[sourceCase].ev;
      if (results[sourceCase].status === 'PASS') expPass++;
    } else {
      cols[expStatusIdx] = 'NOT_RUN';
      expNotRun++;
    }
  } else {
    cols[expStatusIdx] = 'NOT_RUN';
    expNotRun++;
  }
  expLines[i] = cols.join(',');
}

fs.writeFileSync(expandedCsvPath, expLines.join('\n'), 'utf8');
console.log(`Expanded CSV backfilled: PASS=${expPass}, NOT_RUN=${expNotRun}`);

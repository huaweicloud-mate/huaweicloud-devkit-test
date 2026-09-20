import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const pkgDir = 'C:/Users/Administrator/devkit-test/testbot5-win-Codearts-IDE/huaweicloud-devkit-test/results/CodeArtsWork/2026-09-21-120.46.40.202/Windows';
const now = '20260921053000';

// Results map: ID -> { status, evidencePath, blockedReason }
const results = {};

// P0 PASS
['D1-39','D1-40','D2-11','D2-4','D4-1','D4-5','D4-9','D4-15','D4-16','D4-18','D4-19','D4-21','D4-22','D4-28','D8-7','D10-4'].forEach(id => {
  results[id] = { status: 'PASS', evidencePath: `evidence/${id}/stdout.log`, blockedReason: '' };
});
// P0 FAIL
results['D4-2'] = { status: 'FAIL', evidencePath: 'evidence/D4-2/stdout.log', blockedReason: '' };
results['D4-3'] = { status: 'FAIL', evidencePath: 'evidence/cred-group/stdout.log', blockedReason: '' };
results['D4-23'] = { status: 'FAIL', evidencePath: 'evidence/D4-23/stdout.log', blockedReason: '' };

// P1 PASS
['D1-3','D1-26','D1-27','D1-28','D1-31','D1-41','D1-42','D1-45','D1-70','D2-1','D2-5','D2-10','D2-12','D2-13','D2-16','D2-26','D3-A1','D3-B3','D3-C4','D3-C5','D3-C13','D3-S1','D3-S2','D3-S4','D3-S8','D4-4','D4-6','D4-7','D4-8','D4-11','D4-13','D4-17','D4-20','D4-24','D4-27','D5-1','D5-3','D6-4','D8-4','D9-1','D9-2','D9-3','D9-4','D9-5','D9-6','D9-9','D9-10','D9-11'].forEach(id => {
  results[id] = { status: 'PASS', evidencePath: `evidence/${id}/stdout.log`, blockedReason: '' };
});
// D10-3 FAIL (routing accuracy 21.4%)
results['D10-3'] = { status: 'FAIL', evidencePath: 'evidence/D10-3-eval/stdout.log', blockedReason: '' };
// P1 BLOCKED
results['D3-S3'] = { status: 'BLOCKED', evidencePath: 'evidence/D3-S3/sandbox_check.log', blockedReason: 'requires running sandbox instance (Hdkitservice), not available via hcloud CLI' };
results['D3-S7'] = { status: 'BLOCKED', evidencePath: 'evidence/D3-S7/blocked.log', blockedReason: 'complex multi-resource delivery (Web app + RDS), not feasible in daily test window' };

// P2 PASS
['D1-4','D1-30','D1-33','D1-65','D1-66','D1-67','D1-68','D1-69','D2-2','D2-27','D3-B1','D3-B5','D3-C14','D3-S5','D3-S6','D4-10','D4-12','D4-14','D4-25','D4-26','D4-29','D6-1','D6-3','D6-9','D8-1','D8-6','D8-9','D8-10','D9-7','D9-8'].forEach(id => {
  results[id] = { status: 'PASS', evidencePath: 'evidence/p2-batch/stdout.log', blockedReason: '' };
});

// Expanded results
['EXP-D5-4-1','EXP-D5-4-3'].forEach(id => {
  results[id] = { status: 'PASS', evidencePath: 'evidence/D5-matrix/stdout.log', blockedReason: '' };
});
for (let i = 1; i <= 22; i++) {
  const id = `EXP-C4-${String(i).padStart(2,'0')}`;
  results[id] = { status: 'PASS', evidencePath: 'evidence/C4-matrix/stdout.log', blockedReason: '' };
}
// Eval HIT
['EXP-E06','EXP-E09','EXP-E15'].forEach(id => {
  results[id] = { status: 'PASS', evidencePath: 'evidence/D10-3-eval/stdout.log', blockedReason: '' };
});
// Eval MISS
['EXP-E01','EXP-E02','EXP-E03','EXP-E04','EXP-E05','EXP-E07','EXP-E10','EXP-E11','EXP-E12','EXP-E13','EXP-E14'].forEach(id => {
  results[id] = { status: 'FAIL', evidencePath: 'evidence/D10-3-eval/stdout.log', blockedReason: '' };
});
// Eval N/A
results['EXP-E08'] = { status: 'FAIL', evidencePath: 'evidence/D10-3-eval/stdout.log', blockedReason: '' };

// Update design-level CSV
const designPath = join(pkgDir, '用例矩阵-设计级.csv');
const designContent = readFileSync(designPath, 'utf8');
const designLines = designContent.split('\n');
const designHeader = designLines[0];
const designCols = designHeader.split(',');
const statusIdx = designCols.indexOf('执行状态');
const timeIdx = designCols.indexOf('执行时间');
const evidenceIdx = designCols.indexOf('evidencePath');
const blockedIdx = designCols.indexOf('blockedReason');

const updatedDesign = [designHeader];
for (let i = 1; i < designLines.length; i++) {
  const line = designLines[i];
  if (!line.trim()) { updatedDesign.push(line); continue; }
  const cols = line.split(',');
  // Find ID (first column)
  const id = cols[0];
  if (results[id]) {
    cols[statusIdx] = results[id].status;
    cols[timeIdx] = now;
    cols[evidenceIdx] = results[id].evidencePath;
    cols[blockedIdx] = results[id].blockedReason;
  }
  updatedDesign.push(cols.join(','));
}
writeFileSync(designPath, updatedDesign.join('\n'), 'utf8');
console.log('Design CSV updated');

// Update expanded-level CSV
const expPath = join(pkgDir, '用例矩阵-展开级.csv');
const expContent = readFileSync(expPath, 'utf8');
const expLines = expContent.split('\n');
const expHeader = expLines[0];
const expCols = expHeader.split(',');
const expStatusIdx = expCols.indexOf('执行状态');
const expTimeIdx = expCols.indexOf('执行时间');
const expEvidenceIdx = expCols.indexOf('evidencePath');
const expBlockedIdx = expCols.indexOf('blockedReason');

const updatedExp = [expHeader];
for (let i = 1; i < expLines.length; i++) {
  const line = expLines[i];
  if (!line.trim()) { updatedExp.push(line); continue; }
  const cols = line.split(',');
  const id = cols[0];
  if (results[id]) {
    cols[expStatusIdx] = results[id].status;
    cols[expTimeIdx] = now;
    cols[expEvidenceIdx] = results[id].evidencePath;
    cols[expBlockedIdx] = results[id].blockedReason;
  }
  updatedExp.push(cols.join(','));
}
writeFileSync(expPath, updatedExp.join('\n'), 'utf8');
console.log('Expanded CSV updated');

// Summary
const passCount = Object.values(results).filter(r => r.status === 'PASS').length;
const failCount = Object.values(results).filter(r => r.status === 'FAIL').length;
const blockedCount = Object.values(results).filter(r => r.status === 'BLOCKED').length;
console.log(`TOTAL: PASS=${passCount} FAIL=${failCount} BLOCKED=${blockedCount} ALL=${Object.keys(results).length}`);

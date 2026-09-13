// 回填脚本：把今日 AtomCode/Linux 实际执行结果写入 3 份 CSV 副本（只动自己目录）
// 原则：除本次有证据的用例外，其余一律 NOT_RUN（不虚报）。
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = '/home/testbot1/devkit-test/AtomCode/test/results/AtomCode/2026-09-13/Linux';

function parseCsv(text) {
  // 简易 CSV 解析（含引号），保留表头顺序
  const rows = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    // 跳过 BOM
    if (i === 0 && text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const row = [];
    let cell = '';
    i = 0;
    // re-scan after BOM strip
  }
  return rows;
}

// 用更稳妥的方式：整行分列（本文件单元格含分号但无换行内嵌，用逐字符解析）
function parseCsvFull(body) {
  if (body.charCodeAt(0) === 0xfeff) body = body.slice(1);
  const rows = [];
  let row = [];
  let cell = '';
  let inQ = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inQ) {
      if (c === '"') {
        if (body[i + 1] === '"') { cell += '"'; i++; }
        else inQ = false;
      } else cell += c;
    } else if (c === '"') { inQ = true; }
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c === '\r') { /* skip */ }
    else cell += c;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

function serialize(rows) {
  return rows.map(r => r.map(c => {
    const s = String(c ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\n') + '\n';
}

function load(path) {
  const body = readFileSync(path, 'utf8');
  return parseCsvFull(body);
}

function save(path, rows) {
  writeFileSync(path, serialize(rows), 'utf8');
}

function colIndex(header, name) {
  return header.indexOf(name);
}

function apply(table, idCol, statusCol, evCol, reasonCol, overrides) {
  const header = table[0];
  const idIdx = colIndex(header, idCol);
  const stIdx = colIndex(header, statusCol);
  const evIdx = colIndex(header, evCol);
  const reIdx = reasonCol ? colIndex(header, reasonCol) : -1;
  for (let r = 1; r < table.length; r++) {
    const id = table[r][idIdx];
    if (idIdx >= 0) table[r][stIdx] = 'NOT_RUN';
    if (evIdx >= 0) table[r][evIdx] = '';
    if (reIdx >= 0) table[r][reIdx] = '';
    const ov = overrides[id];
    if (ov) {
      table[r][stIdx] = ov.status;
      if (evIdx >= 0) table[r][evIdx] = ov.evidence || '';
      if (reIdx >= 0 && ov.reason) table[r][reIdx] = ov.reason;
    }
  }
  return table;
}

// ---- 设计级 ----
const designOverrides = {
  'D1-28': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D1-40': { status: 'PASS', evidence: 'evidence/d1-upgrade' },
  'D2-2':  { status: 'PASS', evidence: 'evidence/d2-auth' },
  'D2-4':  { status: 'PASS', evidence: 'evidence/d2-auth' },
  'D2-11': { status: 'PASS', evidence: 'evidence/d2-auth' },
  'D4-1':  { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-3':  { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-9':  { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-15': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D4-22': { status: 'PASS', evidence: 'evidence/d4-security-core' },
  'D9-1':  { status: 'PASS', evidence: 'evidence/d9-protocol' },
  'D4-2':  { status: 'FAIL', evidence: 'evidence/d4-security-core', reason: 'safety-policy.mjs classifyTextCommand env 正则未覆盖 HW_ACCESS_KEY/HW_SECRET_KEY 前缀' },
  'D4-16': { status: 'FAIL', evidence: 'evidence/d4-security-core', reason: 'sh -c "env | grep HUAWEICLOUD" wrapper 内层未提取检测，返回 allow' },
  'D4-21': { status: 'FAIL', evidence: 'evidence/d4-security-core', reason: 'risk-rule-engine.mjs evaluateArtifacts 未检出 broad IAM policy actions=["*"]' },
  'D9-2':  { status: 'FAIL', evidence: 'evidence/d9-protocol', reason: 'mcp-server.mjs L165-169 未知方法统一硬编码 -32603，未映射 -32601' },
};

let t = load(DIR + '/用例矩阵-设计级.csv');
t = apply(t, 'ID', '执行状态', 'evidencePath', 'blockedReason', designOverrides);
save(DIR + '/用例矩阵-设计级.csv', t);

// ---- 展开级 ----
let e = load(DIR + '/用例矩阵-展开级.csv');
e = apply(e, 'ID', 'execution_status', 'evidencePath', 'blockedReason', {});
save(DIR + '/用例矩阵-展开级.csv', e);

// ---- 追踪表 ----
let tr = load(DIR + '/需求-设计-证据追踪表.csv');
tr = apply(tr, 'designCaseId', 'execution_status', 'evidencePath', null, {});
save(DIR + '/需求-设计-证据追踪表.csv', tr);

console.log('回填完成。设计级覆盖', Object.keys(designOverrides).length, '项。');
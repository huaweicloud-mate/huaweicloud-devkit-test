// run-all.mjs — 为每条用例生成独立 probe.mjs 并逐条真实执行，stdout 落 evidence/<case-id>/stdout.log
// 用法: node probe-lib/run-all.mjs [caseId ...]
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as d1 from './d1.mjs';
import * as d2 from './d2.mjs';
import * as d3 from './d3.mjs';
import * as extra from './extra.mjs';
import * as misc from './misc.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACK = join(__dirname, '..');
const EV = join(PACK, 'evidence');

const ALL = { ...d1, ...d2, ...d3, ...extra, ...misc };
const CASES = {
  // P0
  'D1-39': 'd1_39', 'D1-40': 'd1_40', 'D2-11': 'd2_11', 'D2-4': 'd2_4',
  'D4-18': 'd4_18', 'D4-19': 'd4_19', 'D4-1': 'd4_1', 'D4-2': 'd4_2',
  'D4-3': 'd4_3', 'D4-5': 'd4_5', 'D4-9': 'd4_9', 'D4-15': 'd4_15',
  'D4-16': 'd4_16', 'D4-21': 'd4_21', 'D4-22': 'd4_22', 'D4-23': 'd4_23',
  'D4-28': 'd4_28', 'D8-7': 'd8_7', 'D9-12': 'd9_12', 'D9-13': 'd9_13',
  'D10-4': 'd10_4',
  // P1
  'D1-3': 'd1_3', 'D1-26': 'd1_26', 'D1-27': 'd1_27', 'D1-28': 'd1_28',
  'D1-31': 'd1_31', 'D1-41': 'd1_41', 'D1-42': 'd1_42', 'D1-45': 'd1_45',
  'D1-70': 'd1_70', 'D2-1': 'd2_1', 'D2-12': 'd2_12', 'D2-13': 'd2_13',
  'D2-16': 'd2_16', 'D2-5': 'd2_5', 'D2-26': 'd2_26', 'D4-11': 'd4_11',
  'D4-13': 'd4_13', 'D4-17': 'd4_17', 'D4-20': 'd4_20', 'D4-24': 'd4_24',
  'D4-27': 'd4_27', 'D5-1': 'd5_1', 'D5-3': 'd5_3', 'D6-4': 'd6_4',
  'D3-A1': 'd3_a1', 'D3-B3': 'd3_b3', 'D3-C4': 'd3_c4', 'D3-C5': 'd3_c5',
  'D3-C13': 'd3_c13', 'D3-S1': 'd3_s1', 'D3-S2': 'd3_s2', 'D3-S3': 'd3_s3',
  'D3-S4': 'd3_s4', 'D3-S7': 'd3_s7', 'D3-S8': 'd3_s8',
  'D8-4': 'd8_4', 'D9-1': 'd9_1', 'D9-2': 'd9_2', 'D9-3': 'd9_3',
  'D9-4': 'd9_4', 'D9-5': 'd9_5', 'D9-6': 'd9_6', 'D9-10': 'd9_10',
  'D9-11': 'd9_11', 'D10-3': 'd10_3',
  // P2
  'D1-4': 'd1_4', 'D1-30': 'd1_30', 'D1-33': 'd1_33', 'D1-65': 'd1_65',
  'D1-66': 'd1_66', 'D1-67': 'd1_67', 'D1-68': 'd1_68', 'D1-69': 'd1_69',
  'D2-2': 'd2_2', 'D2-27': 'd2_27', 'D3-B1': 'd3_b1', 'D3-B5': 'd3_b5',
  'D3-C14': 'd3_c14', 'D3-S5': 'd3_s5', 'D3-S6': 'd3_s6',
  'D4-10': 'd4_10', 'D4-12': 'd4_12', 'D4-14': 'd4_14', 'D4-25': 'd4_25',
  'D4-26': 'd4_26', 'D4-29': 'd4_29', 'D6-1': 'd6_1', 'D6-3': 'd6_3',
  'D6-9': 'd6_9', 'D8-1': 'd8_1', 'D8-6': 'd8_6', 'D8-9': 'd8_9',
  'D8-10': 'd8_10', 'D9-7': 'd9_7', 'D9-8': 'd9_8',
  'D3-B1b': 'd3_b1',
};
for (let i = 1; i <= 15; i++) CASES[`EXP-E${String(i).padStart(2, '0')}`] = `exp_e${String(i).padStart(2, '0')}`;
for (let i = 1; i <= 22; i++) CASES[`EXP-C4-${String(i).padStart(2, '0')}`] = `exp_c4_${String(i).padStart(2, '0')}`;
CASES['EXP-D5-1-1'] = 'exp_d5_1_1';
CASES['EXP-D5-1-3'] = 'exp_d5_1_3';

  const getMod = fn => fn.startsWith('exp') ? 'misc' : fn.startsWith('d1') ? 'd1' : fn.startsWith('d2') ? 'd2' : fn.startsWith('d3') ? 'd3' : fn.startsWith('d4') ? 'd4' : 'misc';
const TEMPLATE = (id, fn) => `// evidence/${id}/probe.mjs — ${id} 独立探针（真实执行断言，非空壳）
import { ${fn} } from '../../probe-lib/${getMod(fn)}.mjs';
await ${fn}();
`;

const only = process.argv.slice(2);
const targets = only.length ? Object.keys(CASES).filter(k => only.includes(k)) : Object.keys(CASES);

mkdirSync(EV, { recursive: true });
const summary = [];
for (const id of targets) {
  const fn = CASES[id];
  if (!fn || typeof ALL[fn] !== 'function') { console.log(`SKIP  ${id} (no impl)`); continue; }
  const dir = join(EV, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const probe = join(dir, 'probe.mjs');
  writeFileSync(probe, TEMPLATE(id, fn), 'utf-8');
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [probe], {
    encoding: 'utf8', timeout: 1200000,
    env: { ...process.env, NO_COLOR: '1' },
  });
  let rep = null;
  try { rep = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf-8')); } catch {}
  const verdict = rep?.verdict || (r.status === 0 ? 'PASS' : 'FAIL');
  const ms = Date.now() - t0;
  summary.push({ id, verdict, ms, assertions: rep?.assertionTotal ?? 0, passed: rep?.assertionPassed ?? 0, note: rep?.note });
  const mark = verdict === 'PASS' ? 'PASS ' : verdict === 'BLOCKED' ? 'BLOCK' : verdict === 'SPEC-MISMATCH' ? 'SPECM' : 'FAIL ';
  console.log(`${mark} ${id.padEnd(14)} ${String(ms).padStart(7)}ms  ${rep?.assertionPassed ?? 0}/${rep?.assertionTotal ?? 0} assertions  ${rep?.title || ''}`);
  if (r.error) console.log(`      exec error: ${r.error.message}`);
}
writeFileSync(join(PACK, 'probe-run-summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
const cnt = s => summary.filter(x => x.verdict === s).length;
console.log(`\n=== 汇总 === total=${summary.length} PASS=${cnt('PASS')} FAIL=${cnt('FAIL')} SPEC-MISMATCH=${cnt('SPEC-MISMATCH')} BLOCKED=${cnt('BLOCKED')}`);
console.log('非 PASS 用例:');
for (const s of summary.filter(x => x.verdict !== 'PASS')) console.log(`  - ${s.id} [${s.verdict}] ${s.note ? s.note.slice(0, 160) : ''}`);
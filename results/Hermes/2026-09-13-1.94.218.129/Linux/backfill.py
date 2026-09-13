#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""回填执行状态 + 执行时间 + evidencePath 到 3 份 CSV（设计级 + 展开级 + 追踪表）。"""
import csv, os, datetime

D = '/home/testbot3/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-13-1.94.218.129/Linux'
TS = '20260913221408'  # 北京时间 14 位

# ============ 设计级 81 条 状态 ============
# PASS: 57, FAIL: 5, SPEC-MISMATCH: 1, BLOCKED: 3, NOT_RUN: 15
design = {
    # D1 安装
    'D1-1': 'NOT_RUN', 'D1-2': 'NOT_RUN', 'D1-3': 'PASS', 'D1-4': 'PASS',
    'D1-5': 'NOT_RUN', 'D1-6': 'PASS',
    'D1-26': 'PASS', 'D1-27': 'PASS', 'D1-28': 'PASS', 'D1-30': 'PASS',
    'D1-31': 'PASS', 'D1-33': 'PASS', 'D1-39': 'PASS', 'D1-40': 'PASS',
    'D1-41': 'PASS', 'D1-42': 'PASS', 'D1-45': 'NOT_RUN', 'D1-58': 'PASS',
    # D2 认证
    'D2-1': 'PASS', 'D2-2': 'PASS', 'D2-4': 'PASS', 'D2-5': 'PASS',
    'D2-10': 'PASS', 'D2-11': 'PASS', 'D2-12': 'PASS', 'D2-13': 'PASS',
    'D2-16': 'PASS',
    # D4 安全
    'D4-1': 'PASS', 'D4-2': 'FAIL', 'D4-3': 'PASS', 'D4-4': 'FAIL',
    'D4-5': 'PASS', 'D4-6': 'PASS', 'D4-7': 'PASS', 'D4-8': 'PASS',
    'D4-9': 'PASS', 'D4-10': 'PASS', 'D4-11': 'FAIL', 'D4-12': 'NOT_RUN',
    'D4-13': 'PASS', 'D4-14': 'BLOCKED', 'D4-15': 'PASS', 'D4-16': 'FAIL',
    'D4-17': 'PASS', 'D4-18': 'PASS', 'D4-19': 'PASS', 'D4-20': 'PASS',
    'D4-21': 'PASS', 'D4-22': 'PASS', 'D4-23': 'FAIL', 'D4-24': 'PASS',
    # D3 功能
    'D3-A1': 'PASS', 'D3-B1': 'PASS', 'D3-B3': 'PASS', 'D3-B5': 'PASS',
    'D3-C4': 'BLOCKED', 'D3-C5': 'PASS',
    # D5 客户端
    'D5-1': 'PASS', 'D5-3': 'PASS',
    # D6 性能
    'D6-1': 'NOT_RUN', 'D6-3': 'NOT_RUN', 'D6-4': 'NOT_RUN',
    # D9 协议
    'D9-1': 'PASS', 'D9-2': 'SPEC-MISMATCH', 'D9-3': 'PASS', 'D9-4': 'PASS',
    'D9-5': 'PASS', 'D9-6': 'BLOCKED', 'D9-7': 'PASS', 'D9-8': 'PASS',
    'D9-9': 'NOT_RUN',
    # D7 兼容
    'D7-4': 'NOT_RUN',
    # D8 质量
    'D8-1': 'NOT_RUN', 'D8-4': 'PASS', 'D8-6': 'PASS', 'D8-7': 'PASS',
    # D10 评测
    'D10-1': 'NOT_RUN', 'D10-2': 'NOT_RUN', 'D10-3': 'NOT_RUN',
    'D10-4': 'PASS', 'D10-5': 'NOT_RUN',
}

# ============ 展开级 71 条 状态 ============
# PASS: 6, BLOCKED: 23, NOT_RUN: 42
expanded = {}
for i in range(1, 11):
    client = ['OpenCode','Codex','CodeArtsAgent','CodeArtsWork','WorkBuddy','DSH','OfficeAce','Hermes','OpenClaw','AtomCode'][i-1]
    for suffix in ['1', '3']:
        cid = f'EXP-D5-{i}-{suffix}'
        expanded[cid] = 'PASS' if client == 'Hermes' else 'NOT_RUN'
for i in range(1, 23):
    expanded[f'EXP-C4-{i:02d}'] = 'BLOCKED'
for i in range(1, 16):
    expanded[f'EXP-E{i:02d}'] = 'NOT_RUN'
expanded.update({
    'EXP-NR3-01': 'NOT_RUN', 'EXP-NR3-02': 'PASS', 'EXP-NR3-03': 'NOT_RUN',
    'EXP-NR3-04': 'PASS', 'EXP-NR3-09': 'NOT_RUN', 'EXP-NR3-10': 'PASS',
    'EXP-NR3-11': 'BLOCKED', 'EXP-NR3-23': 'NOT_RUN', 'EXP-NR3-24': 'PASS',
})
for i in range(1, 6):
    expanded[f'EXP-D1-58-{i:02d}'] = 'NOT_RUN'

# evidence 映射：source 探针/CLI 都有 evidence/<id>/stdout.log
def evidence_path(cid, status):
    ev = f'evidence/{cid}/stdout.log'
    full = os.path.join(D, ev)
    if os.path.exists(full):
        return ev
    return ''

def apply(csv_path, status_map, id_col, has_evidence):
    src = os.path.join(D, csv_path)
    rows = list(csv.DictReader(open(src, encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    for r in rows:
        cid = r[id_col]
        st = status_map.get(cid, 'NOT_RUN')
        r['执行状态'] = '' if st == 'NOT_RUN' else st
        r['执行时间'] = TS if st in ('PASS','FAIL','SPEC-MISMATCH','BLOCKED') else ''
        if has_evidence:
            r['evidencePath'] = evidence_path(cid, st) if st == 'PASS' or st == 'FAIL' or st == 'SPEC-MISMATCH' else ''
    with open(src, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in fields})
    return rows, fields

design_rows, design_fields = apply('用例矩阵-设计级.csv', design, 'ID', True)
expanded_rows, expanded_fields = apply('用例矩阵-展开级.csv', expanded, 'ID', True)

# ============ 追踪表：回填执行时间 ============
tr_path = os.path.join(D, '需求-设计-证据追踪表.csv')
tr_rows = list(csv.DictReader(open(tr_path, encoding='utf-8-sig')))
tr_fields = list(tr_rows[0].keys())
executed = {k: v for k, v in design.items() if v in ('PASS','FAIL','SPEC-MISMATCH','BLOCKED')}
executed.update({k: v for k, v in expanded.items() if v in ('PASS','FAIL','SPEC-MISMATCH','BLOCKED')})
for r in tr_rows:
    dcid = r.get('designCaseId', '')
    ecid = r.get('expandedCaseId', '')
    r['执行时间'] = TS if (dcid in executed or ecid in executed) else ''
with open(tr_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=tr_fields)
    w.writeheader()
    for r in tr_rows:
        w.writerow({k: r.get(k, '') for k in tr_fields})

# ============ 汇总统计 ============
from collections import Counter
dc = Counter(design.values()); ec = Counter(expanded.values())
print('=== 设计级 ===', dict(dc))
print('=== 展开级 ===', dict(ec))
print('设计级合计:', sum(dc.values()), '展开级合计:', sum(ec.values()))
allc = dc + ec
print('=== 总 ===', dict(allc), '总合计:', sum(allc.values()))
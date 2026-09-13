#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""拆分探针输出到 evidence/<case-id>/stdout.log 并回填 3 份 CSV（设计级+展开级+追踪表）。
用法: python backfill.py  (在本日执行包目录内运行)
"""
import csv, os, re, json

D = os.path.dirname(os.path.abspath(__file__))
TS = '20260914071614'  # 北京时间 14 位

# ============ 1. 拆分探针输出 ============
EVID = os.path.join(D, 'evidence')
os.makedirs(EVID, exist_ok=True)

def split_log(logname):
    path = os.path.join(D, logname)
    if not os.path.isfile(path):
        print(f'[跳过] 缺 {logname}')
        return 0
    text = open(path, encoding='utf-8').read()
    blocks = re.findall(r'@@CASE\s+([\w-]+)@@(.*?)@@END@@', text, re.S)
    for cid, body in blocks:
        dd = os.path.join(EVID, cid)
        os.makedirs(dd, exist_ok=True)
        with open(os.path.join(dd, 'stdout.log'), 'w', encoding='utf-8') as f:
            f.write(f'@@CASE {cid}@@\n{body.strip()}\n@@END@@\n')
    print(f'{logname}: 拆分 {len(blocks)} 个 case')
    return len(blocks)

n1 = split_log('stdout-daily.log')
n2 = split_log('stdout-supplement.log')
n3 = split_log('stdout-exp.log')
print(f'探针拆分合计: {n1 + n2 + n3}（CLI 3 例已直写 evidence）')

# ============ 2. 状态映射（authoritative） ============
# 设计级 81 条：PASS 57 / FAIL 5 / SPEC 1 / BLOCKED 3 / NOT_RUN 15
design = {}
design_pass = [
    # D1 安装 P1/P2（CLI 真机 + 源码）
    'D1-3', 'D1-4', 'D1-6',
    'D1-26', 'D1-27', 'D1-28', 'D1-30', 'D1-31', 'D1-33', 'D1-39', 'D1-40',
    'D1-41', 'D1-42', 'D1-58',
    # D2 认证
    'D2-1', 'D2-2', 'D2-4', 'D2-5', 'D2-10', 'D2-11', 'D2-12', 'D2-13', 'D2-16',
    # D3 功能
    'D3-A1', 'D3-B1', 'D3-B3', 'D3-B5', 'D3-C5',
    # D4 安全
    'D4-1', 'D4-3', 'D4-5', 'D4-6', 'D4-7', 'D4-8', 'D4-9', 'D4-10',
    'D4-13', 'D4-15', 'D4-17', 'D4-18', 'D4-19', 'D4-20', 'D4-21', 'D4-22', 'D4-24',
    # D5 客户端
    'D5-1', 'D5-3',
    # D8 质量
    'D8-4', 'D8-6', 'D8-7',
    # D9 协议
    'D9-1', 'D9-3', 'D9-4', 'D9-5', 'D9-7', 'D9-8',
    # D10 评测
    'D10-4',
]
for cid in design_pass:
    design[cid] = 'PASS'
design.update({
    'D4-2': 'FAIL', 'D4-4': 'FAIL', 'D4-11': 'FAIL', 'D4-16': 'FAIL', 'D4-23': 'FAIL',
    'D9-2': 'SPEC-MISMATCH',
    'D4-14': 'BLOCKED', 'D3-C4': 'BLOCKED', 'D9-6': 'BLOCKED',
    # NOT_RUN（不写状态）
    'D1-1': 'NOT_RUN', 'D1-2': 'NOT_RUN', 'D1-5': 'NOT_RUN', 'D1-45': 'NOT_RUN',
    'D4-12': 'NOT_RUN',
    'D6-1': 'NOT_RUN', 'D6-3': 'NOT_RUN', 'D6-4': 'NOT_RUN',
    'D9-9': 'NOT_RUN', 'D7-4': 'NOT_RUN', 'D8-1': 'NOT_RUN',
    'D10-1': 'NOT_RUN', 'D10-2': 'NOT_RUN', 'D10-3': 'NOT_RUN', 'D10-5': 'NOT_RUN',
})

# 展开级 71 条：PASS 6 / BLOCKED 23 / NOT_RUN 42
expanded = {}
clients = ['OpenCode', 'Codex', 'CodeArtsAgent', 'CodeArtsWork', 'WorkBuddy',
           'DSH', 'OfficeAce', 'Hermes', 'OpenClaw', 'AtomCode']
for i in range(1, 11):
    client = clients[i - 1]
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

# 需要有证据的状态：PASS / FAIL / SPEC-MISMATCH（BLOCKED/NOT_RUN 无证据）
def evidence_path(cid, status):
    if status not in ('PASS', 'FAIL', 'SPEC-MISMATCH'):
        return ''
    ev = f'evidence/{cid}/stdout.log'
    if os.path.exists(os.path.join(D, ev)):
        return ev
    return ''

def apply(csv_path, status_map, id_col, has_evidence):
    src = os.path.join(D, csv_path)
    rows = list(csv.DictReader(open(src, encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    missing = []
    for r in rows:
        cid = r[id_col]
        st = status_map.get(cid, 'NOT_RUN')
        if cid not in status_map:
            missing.append(cid)
        r['执行状态'] = '' if st == 'NOT_RUN' else st
        r['执行时间'] = TS if st in ('PASS', 'FAIL', 'SPEC-MISMATCH', 'BLOCKED') else ''
        if has_evidence:
            r['evidencePath'] = evidence_path(cid, st) if st in ('PASS', 'FAIL', 'SPEC-MISMATCH') else ''
    with open(src, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, '') for k in fields})
    if missing:
        print(f'[警告] {csv_path} 状态映射缺失 {len(missing)} 条: {missing[:10]}')
    return rows

design_rows = apply('用例矩阵-设计级.csv', design, 'ID', True)
expanded_rows = apply('用例矩阵-展开级.csv', expanded, 'ID', True)

# ============ 3. 追踪表回填执行时间 ============
tr_path = os.path.join(D, '需求-设计-证据追踪表.csv')
tr_rows = list(csv.DictReader(open(tr_path, encoding='utf-8-sig')))
tr_fields = list(tr_rows[0].keys())
executed = {k: v for k, v in design.items() if v in ('PASS', 'FAIL', 'SPEC-MISMATCH', 'BLOCKED')}
executed.update({k: v for k, v in expanded.items() if v in ('PASS', 'FAIL', 'SPEC-MISMATCH', 'BLOCKED')})
for r in tr_rows:
    dcid = r.get('designCaseId', '') or r.get('源用例', '') or ''
    ecid = r.get('expandedCaseId', '') or ''
    # 匹配追踪表的 case id 列（可能是 designCaseId / expandedCaseId 或其它）
    hit = dcid in executed or ecid in executed
    if not hit:
        for k in ('designCaseId', 'expandedCaseId', '源用例', 'ID', '设计用例ID', '展开用例ID'):
            v = r.get(k, '')
            if v and v in executed:
                hit = True
                break
    r['执行时间'] = TS if hit else ''
with open(tr_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=tr_fields)
    w.writeheader()
    for r in tr_rows:
        w.writerow({k: r.get(k, '') for k in tr_fields})

# ============ 4. 汇总 ============
from collections import Counter
dc = Counter(design.values()); ec = Counter(expanded.values())
print('\n=== 设计级 ===', dict(dc), '合计', sum(dc.values()))
print('=== 展开级 ===', dict(ec), '合计', sum(ec.values()))
allc = dc + ec
print('=== 总计 ===', dict(allc), '总合计', sum(allc.values()))
# evidence 目录数
ev_dirs = [d for d in os.listdir(EVID) if os.path.isdir(os.path.join(EVID, d))]
print('evidence 目录数:', len(ev_dirs))
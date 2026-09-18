#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Backfill execution status, time, evidencePath, blockedReason in all CSVs."""
import csv
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

BASE = Path(r"C:\Users\Administrator\devkit-test\testbot4-win-workbuddy\huaweicloud-devkit-test\results\WorkBuddy\2026-09-19-188.239.14.150\Windows")
EVIDENCE_BASE = "evidence"

# Beijing time
bj_tz = timezone(timedelta(hours=8))
now = datetime.now(bj_tz)
ts = now.strftime("%Y%m%d%H%M%S")

print(f"Backfill timestamp: {ts}")

# ---- Expanded CSV backfill ----
expanded_csv = BASE / "用例矩阵-展开级.csv"
with open(expanded_csv, 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    rows = list(reader)

header = rows[0]
# Find column indices
idx_status = header.index('执行状态')
idx_time = header.index('执行时间')
idx_evidence = header.index('evidencePath')
idx_blocked = header.index('blockedReason')
idx_id = header.index('ID')

# Expanded results
expanded_results = {
    'EXP-D5-5-1': ('PASS', f'{EVIDENCE_BASE}/EXP-D5-5-1/', ''),
    'EXP-D5-5-3': ('PASS', f'{EVIDENCE_BASE}/EXP-D5-5-3/', ''),
}

# C4 results - all PASS
for i in range(1, 23):
    cid = f'EXP-C4-{i:02d}'
    expanded_results[cid] = ('PASS', f'{EVIDENCE_BASE}/{cid}/', '')

# E results
e_results = {
    'EXP-E01': ('FAIL', f'{EVIDENCE_BASE}/EXP-E01/', ''),
    'EXP-E02': ('FAIL', f'{EVIDENCE_BASE}/EXP-E02/', ''),
    'EXP-E03': ('FAIL', f'{EVIDENCE_BASE}/EXP-E03/', ''),
    'EXP-E04': ('FAIL', f'{EVIDENCE_BASE}/EXP-E04/', ''),
    'EXP-E05': ('FAIL', f'{EVIDENCE_BASE}/EXP-E05/', ''),
    'EXP-E06': ('PASS', f'{EVIDENCE_BASE}/EXP-E06/', ''),
    'EXP-E07': ('FAIL', f'{EVIDENCE_BASE}/EXP-E07/', ''),
    'EXP-E08': ('BLOCKED', f'{EVIDENCE_BASE}/EXP-E08/', '源码级serviceCatalog路由为N/A(explain_error是工具非服务,serviceCatalog无法路由); Agent行为层需LLM harness,当前不可用'),
    'EXP-E09': ('PASS', f'{EVIDENCE_BASE}/EXP-E09/', ''),
    'EXP-E10': ('FAIL', f'{EVIDENCE_BASE}/EXP-E10/', ''),
    'EXP-E11': ('FAIL', f'{EVIDENCE_BASE}/EXP-E11/', ''),
    'EXP-E12': ('FAIL', f'{EVIDENCE_BASE}/EXP-E12/', ''),
    'EXP-E13': ('FAIL', f'{EVIDENCE_BASE}/EXP-E13/', ''),
    'EXP-E14': ('FAIL', f'{EVIDENCE_BASE}/EXP-E14/', ''),
    'EXP-E15': ('PASS', f'{EVIDENCE_BASE}/EXP-E15/', ''),
}
expanded_results.update(e_results)

for row in rows[1:]:
    case_id = row[idx_id]
    if case_id in expanded_results:
        status, evidence, blocked = expanded_results[case_id]
        row[idx_status] = status
        row[idx_time] = ts
        row[idx_evidence] = evidence
        row[idx_blocked] = blocked

with open(expanded_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Expanded CSV backfilled: {len(expanded_results)} cases")

# ---- Design-level CSV backfill ----
design_csv = BASE / "用例矩阵-设计级.csv"
with open(design_csv, 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    rows = list(reader)

header = rows[0]
idx_status = header.index('执行状态')
idx_time = header.index('执行时间')
idx_evidence = header.index('evidencePath')
idx_blocked = header.index('blockedReason')
idx_id = header.index('ID')
idx_terminal = header.index('terminal')
idx_priority = header.index('优先级')
idx_expand_rule = header.index('展开规则')

# Design-level results
design_results = {}

# Cases covered by expanded level
covered_by_expanded = {
    'D5-1': 'EXP-D5-5-1',
    'D5-3': 'EXP-D5-5-3',
    'D3-C4': 'EXP-C4-01~22',
    'D10-3': 'EXP-E01~E15',
}
for cid, exp in covered_by_expanded.items():
    design_results[cid] = ('NOT_RUN', '', '', f'展开级{exp}已代表执行本客户端')

# D10-4: P0, includes WorkBuddy, needs LLM harness
design_results['D10-4'] = ('BLOCKED', '', '', '需真实Agent会话行为评测(LLM harness),serviceCatalog路由层无法代理; 解除条件=LLM harness就绪')

# All other cases: NOT_RUN (representative terminal is Hermes/OpenCode, not WorkBuddy)
for row in rows[1:]:
    case_id = row[idx_id]
    if case_id in design_results:
        continue
    
    terminal = row[idx_terminal] if idx_terminal < len(row) else ''
    priority = row[idx_priority] if idx_priority < len(row) else ''
    
    # Check if WorkBuddy is in the terminal string
    if 'WorkBuddy' in terminal:
        # WorkBuddy is mentioned but no expanded case - check if we should execute
        if priority == 'P0':
            design_results[case_id] = ('BLOCKED', '', '', f'终端覆盖含WorkBuddy但需真实Agent/LLM harness或hook-capable环境')
        else:
            design_results[case_id] = ('NOT_RUN', '', '', f'代表终端含WorkBuddy但展开级未下发(非本客户端主要代表)')
    else:
        # WorkBuddy not in terminal - NOT_RUN
        reason = f'代表终端为{terminal[:30]}...非WorkBuddy; 展开级未下发本客户端'
        design_results[case_id] = ('NOT_RUN', '', '', reason)

for row in rows[1:]:
    case_id = row[idx_id]
    if case_id in design_results:
        status, evidence, _, blocked = design_results[case_id]
        row[idx_status] = status
        row[idx_time] = ts
        row[idx_evidence] = evidence
        row[idx_blocked] = blocked

with open(design_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Design-level CSV backfilled: {len(design_results)} cases")

# ---- Tracing table backfill ----
tracing_csv = BASE / "需求-设计-证据追踪表.csv"
with open(tracing_csv, 'r', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    rows = list(reader)

header = rows[0]
idx_time_tracing = header.index('执行时间')

for row in rows[1:]:
    if idx_time_tracing < len(row):
        row[idx_time_tracing] = ts

with open(tracing_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Tracing table backfilled: {len(rows)-1} rows")
print("\nBackfill complete!")

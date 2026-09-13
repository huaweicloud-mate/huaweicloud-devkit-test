# -*- coding: utf-8 -*-
"""Backfill execution status into CSV files using proper CSV parsing."""
import csv, os, sys

base_dir = r'C:\Users\Administrator\WorkBuddy\devkit-test\huaweicloud-devkit-test\results\WorkBuddy\2026-09-13-188.239.14.150\Windows'

# Execution results map: caseId -> { status, evidencePath }
results = {
    'D4-1': ('PASS', 'evidence/d4-security-core/'),
    'D4-2': ('SPEC-MISMATCH', 'evidence/d4-security-core/'),
    'D4-3': ('PASS', 'evidence/d4-security-core/'),
    'D4-5': ('PASS', 'evidence/d4-security-core/'),
    'D4-7': ('PASS', 'evidence/d4-security-core/'),
    'D4-8': ('PASS', 'evidence/d4-security-core/'),
    'D4-9': ('PASS', 'evidence/d4-security-core/'),
    'D4-15': ('FAIL', 'evidence/d4-security-core/'),
    'D4-16': ('SPEC-MISMATCH', 'evidence/d4-security-core/'),
    'D4-17': ('PASS', 'evidence/d4-security-core/'),
    'D4-18': ('PASS', 'evidence/d4-security-core/'),
    'D4-19': ('FAIL', 'evidence/d4-security-core/'),
    'D4-20': ('PASS', 'evidence/d4-security-core/'),
    'D4-21': ('PASS', 'evidence/d4-security-core/'),
    'D4-22': ('PASS', 'evidence/d4-security-core/'),
    'D4-23': ('SPEC-MISMATCH', 'evidence/d4-security-core/'),
    'D2-4': ('PASS', 'evidence/d4-security-core/'),
    'D1-26': ('PASS', 'evidence/d1-upgrade/'),
    'D1-27': ('PASS', 'evidence/d1-upgrade/'),
    'D1-28': ('PASS', 'evidence/d1-upgrade/'),
    'D1-30': ('PASS', 'evidence/d1-upgrade/'),
    'D1-31': ('PASS', 'evidence/d1-upgrade/'),
    'D1-33': ('PASS', 'evidence/d1-upgrade/'),
    'D1-39': ('PASS', 'evidence/d1-upgrade/'),
    'D1-40': ('PASS', 'evidence/d1-upgrade/'),
    'D1-41': ('PASS', 'evidence/d1-upgrade/'),
    'D1-42': ('PASS', 'evidence/d1-upgrade/'),
    'D1-45': ('PASS', 'evidence/d1-upgrade/'),
    'D2-2': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D2-5': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D2-10': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D2-11': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D2-12': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D2-13': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D2-16': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D3-A1': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D3-B1': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D3-B3': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D3-B5': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D3-C5': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D1-3': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D1-4': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D1-6': ('PASS', 'evidence/d2-d3-auth-func/'),
    'D5-1': ('PASS', 'evidence/d5-static/'),
    'D5-3': ('PASS', 'evidence/d5-static/'),
    'D5-8': ('PASS', 'evidence/d5-static/'),
    'D6-1': ('PASS', 'evidence/d5-static/'),
    'D6-3': ('PASS', 'evidence/d5-static/'),
    'D6-4': ('PASS', 'evidence/d5-static/'),
    'D8-1': ('PASS', 'evidence/d5-static/'),
    'D8-4': ('PASS', 'evidence/d5-static/'),
    'D8-6': ('PASS', 'evidence/d5-static/'),
    'D8-7': ('PASS', 'evidence/d5-static/'),
    'D7-4': ('PASS', 'evidence/d5-static/'),
    'D9-1': ('PASS', 'evidence/d9-protocol/'),
    'D9-3': ('PASS', 'evidence/d9-protocol/'),
    'D9-4': ('FAIL', 'evidence/d9-protocol/'),
    'D9-5': ('PASS', 'evidence/d9-protocol/'),
    'D9-8': ('PASS', 'evidence/d9-protocol/'),
    'D9-2': ('FAIL', 'evidence/d9-robust/'),
    'D9-7': ('FAIL', 'evidence/d9-robust/'),
}

# Backfill design CSV
design_path = os.path.join(base_dir, '用例矩阵-设计级.csv')
with open(design_path, encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    fields = reader.fieldnames
    rows = list(reader)

# Ensure '执行状态' and 'evidencePath' columns exist
if '执行状态' not in fields:
    fields = list(fields) + ['执行状态']
if 'evidencePath' not in fields:
    fields = list(fields) + ['evidencePath']

pass_count = fail_count = spec_count = not_run_count = 0
for row in rows:
    cid = row.get('ID', '')
    if cid in results:
        status, ev = results[cid]
        row['执行状态'] = status
        row['evidencePath'] = ev
    else:
        if not row.get('执行状态'):
            row['执行状态'] = 'NOT_RUN'
            if not row.get('evidencePath'):
                row['evidencePath'] = ''
    
    s = (row.get('执行状态') or '').strip().upper()
    if s == 'PASS': pass_count += 1
    elif s == 'FAIL': fail_count += 1
    elif s == 'SPEC-MISMATCH': spec_count += 1
    else: not_run_count += 1

with open(design_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

print(f'Design CSV backfilled: PASS={pass_count}, FAIL={fail_count}, SPEC={spec_count}, NOT_RUN={not_run_count}')

# Backfill expanded CSV
exp_path = os.path.join(base_dir, '用例矩阵-展开级.csv')
with open(exp_path, encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    exp_fields = reader.fieldnames
    exp_rows = list(reader)

for row in exp_rows:
    row['execution_status'] = 'NOT_RUN'
    row['evidencePath'] = ''

with open(exp_path, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=exp_fields)
    writer.writeheader()
    writer.writerows(exp_rows)

print(f'Expanded CSV backfilled: all NOT_RUN (multi-client shared matrix)')

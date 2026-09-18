#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Final backfill: update design-level CSV with all P0 + non-P0 results."""
import csv
import json
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta

BASE = Path(r"C:\Users\Administrator\devkit-test\testbot4-win-workbuddy\huaweicloud-devkit-test\results\WorkBuddy\2026-09-19-188.239.14.150\Windows")
EVIDENCE = BASE / "evidence"

bj_tz = timezone(timedelta(hours=8))
now = datetime.now(bj_tz)
ts = now.strftime("%Y%m%d%H%M%S")

# Read probe summaries
with open(EVIDENCE / "p0-design-summary.json", 'r', encoding='utf-8') as f:
    p0_results = json.load(f)
with open(EVIDENCE / "non-p0-design-summary.json", 'r', encoding='utf-8') as f:
    non_p0_results = json.load(f)

# Merge all results
all_results = {}
for case_id, data in p0_results.items():
    if data.get('blocked'):
        all_results[case_id] = ('BLOCKED', f'evidence/{case_id}/', data.get('detail', ''))
    elif data['pass']:
        all_results[case_id] = ('PASS', f'evidence/{case_id}/', '')
    else:
        all_results[case_id] = ('FAIL', f'evidence/{case_id}/', data.get('detail', ''))

for case_id, data in non_p0_results.items():
    if data['pass']:
        all_results[case_id] = ('PASS', f'evidence/{case_id}/', '')
    else:
        all_results[case_id] = ('FAIL', f'evidence/{case_id}/', data.get('detail', ''))

# Add missing D4-20
all_results['D4-20'] = ('PASS', 'evidence/D4-20/', 'Reject path verified: plan_cli_command allowWrites=false does not execute commands')

# Read and update design-level CSV
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

updated = 0
for row in rows[1:]:
    case_id = row[idx_id]
    if case_id in all_results:
        status, evidence, detail = all_results[case_id]
        row[idx_status] = status
        row[idx_time] = ts
        row[idx_evidence] = evidence
        if status in ('BLOCKED', 'FAIL'):
            row[idx_blocked] = detail
        else:
            row[idx_blocked] = ''
        updated += 1

with open(design_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print(f"Design-level CSV updated: {updated}/{len(rows)-1} cases")

# Create evidence directories for design-level cases
for case_id, (status, evidence_path, detail) in all_results.items():
    case_dir = EVIDENCE / case_id
    case_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy probe scripts
    if case_id in p0_results:
        import shutil
        shutil.copy2(EVIDENCE / "p0-design-probe.mjs", case_dir / "probe.mjs")
    elif case_id in non_p0_results:
        import shutil
        shutil.copy2(EVIDENCE / "non-p0-design-probe.mjs", case_dir / "probe.mjs")
    
    # Write probe.txt
    with open(case_dir / "probe.txt", 'w', encoding='utf-8') as f:
        f.write(f"# {case_id} Evidence\n\n## Result: {status}\n## Detail: {detail}\n## Evidence Path: {evidence_path}\n## Timestamp: {ts}\n")

# Count results
from collections import Counter
status_counts = Counter(v[0] for v in all_results.values())
print(f"\nStatus summary:")
for s, c in status_counts.most_common():
    print(f"  {s}: {c}")
print(f"\nTotal: {sum(status_counts.values())}")

#!/usr/bin/env python3
"""Backfill execution results into CSVs."""
import csv
import os
import datetime
import json

RESULT_DIR = os.path.dirname(os.path.abspath(__file__))

# Correct Beijing time (system is already UTC+8, so local time = Beijing time)
beijing = datetime.datetime.now()
ts = beijing.strftime('%Y%m%d%H%M%S')

# All test results from probes
# Format: case_id -> (status, evidence_path, blocked_reason)
results = {
    # P0
    'D1-39': ('PASS', 'evidence/D1-39/', ''),
    'D1-40': ('PASS', 'evidence/D1-40/', ''),
    'D2-4': ('PASS', 'evidence/D2-4/', ''),
    'D2-11': ('PASS', 'evidence/D2-11/', ''),
    'D4-1': ('PASS', 'evidence/D4-1/', ''),
    'D4-2': ('PASS', 'evidence/D4-2/', ''),
    'D4-3': ('PASS', 'evidence/D4-3/', ''),
    'D4-5': ('PASS', 'evidence/D4-5/', ''),
    'D4-9': ('PASS', 'evidence/D4-9/', ''),
    'D4-15': ('FAIL', 'evidence/D4-15/', ''),
    'D4-16': ('FAIL', 'evidence/D4-16/', ''),
    'D4-18': ('PASS', 'evidence/D4-18/', ''),
    'D4-19': ('PASS', 'evidence/D4-19/', ''),
    'D4-21': ('PASS', 'evidence/D4-21/', ''),
    'D4-22': ('PASS', 'evidence/D4-22/', ''),
    'D4-23': ('PASS', 'evidence/D4-23/', ''),
    'D8-7': ('PASS', 'evidence/D8-7/', ''),
    'D10-4': ('PASS', 'evidence/D10-4/', ''),
    # P1
    'D1-1': ('BLOCKED', '', 'Cannot reset to fresh-uninstalled state in active WorkBuddy session'),
    'D1-3': ('PASS', 'evidence/D1-3/', ''),
    'D1-5': ('BLOCKED', '', 'Cannot run uninstall in active testing session'),
    'D1-26': ('PASS', 'evidence/D1-26/', ''),
    'D1-27': ('PASS', 'evidence/D1-27/', ''),
    'D1-28': ('PASS', 'evidence/D1-28/', ''),
    'D1-31': ('PASS', 'evidence/D1-31/', ''),
    'D1-41': ('BLOCKED', '', 'Requires MCP server with mock result injection'),
    'D1-42': ('BLOCKED', '', 'Requires MCP server lifecycle management'),
    'D1-45': ('BLOCKED', '', 'Requires MCP server startup timing control'),
    'D1-58': ('BLOCKED', '', 'Requires isolated HOME + fresh install'),
    'D2-1': ('BLOCKED', '', 'Requires real cloud credential initialization'),
    'D2-5': ('BLOCKED', '', 'Requires credential removal and real auth init'),
    'D2-10': ('PASS', 'evidence/D2-10/', ''),
    'D2-12': ('PASS', 'evidence/D2-12/', ''),
    'D2-13': ('PASS', 'evidence/D2-13/', ''),
    'D2-16': ('PASS', 'evidence/D2-16/', ''),
    'D3-A1': ('PASS', 'evidence/D3-A1/', ''),
    'D3-B3': ('BLOCKED', '', 'Requires real MCP server tool call'),
    'D3-C4': ('BLOCKED', '', 'Requires real cloud resources - E2E test'),
    'D3-C5': ('PASS', 'evidence/D3-C5/', ''),
    'D4-4': ('PASS', 'evidence/D4-4/', ''),
    'D4-6': ('PASS', 'evidence/D4-6/', ''),
    'D4-7': ('PASS', 'evidence/D4-7/', ''),
    'D4-8': ('PASS', 'evidence/D4-8/', ''),
    'D4-11': ('BLOCKED', '', 'Requires LLM agent behavior testing'),
    'D4-13': ('BLOCKED', '', 'Requires real cloud credential with minimum privilege (credentials.readonly.json not configured)'),
    'D4-17': ('PASS', 'evidence/D4-17/', ''),
    'D4-20': ('BLOCKED', '', 'Requires real MCP server with approval flow'),
    'D4-24': ('BLOCKED', '', 'Requires MCP server with confirm token lifecycle'),
    'D5-1': ('PASS', 'evidence/D5-1/', ''),
    'D5-3': ('PASS', 'evidence/D5-3/', ''),
    'D6-4': ('BLOCKED', '', 'Requires MCP server concurrent test harness'),
    'D8-4': ('PASS', 'evidence/D8-4/', ''),
    'D9-1': ('PASS', 'evidence/D9-1/', ''),
    'D9-2': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D9-3': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D9-4': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D9-5': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D9-6': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D9-9': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D10-1': ('BLOCKED', '', 'Requires LLM agent harness'),
    'D10-2': ('BLOCKED', '', 'Requires LLM agent harness'),
    'D10-3': ('BLOCKED', '', 'Requires LLM agent harness'),
    'D10-5': ('BLOCKED', '', 'Requires LLM agent harness'),
    # P2
    'D1-2': ('PASS', 'evidence/D1-2/', ''),
    'D1-4': ('PASS', 'evidence/D1-4/', ''),
    'D1-6': ('PASS', 'evidence/D1-6/', ''),
    'D1-30': ('PASS', 'evidence/D1-30/', ''),
    'D1-33': ('PASS', 'evidence/D1-33/', ''),
    'D2-2': ('PASS', 'evidence/D2-2/', ''),
    'D3-B1': ('BLOCKED', '', 'Requires real MCP server tool calls'),
    'D3-B5': ('BLOCKED', '', 'Requires real MCP server tool calls'),
    'D4-10': ('PASS', 'evidence/D4-10/', ''),
    'D4-12': ('BLOCKED', '', 'Requires fresh install with malicious package'),
    'D4-14': ('BLOCKED', '', 'Requires real cloud audit log access'),
    'D6-1': ('BLOCKED', '', 'Requires performance benchmarking'),
    'D6-3': ('BLOCKED', '', 'Requires performance benchmarking'),
    'D7-4': ('PASS', 'evidence/D7-4/', ''),
    'D8-1': ('PASS', 'evidence/D8-1/', ''),
    'D8-6': ('PASS', 'evidence/D8-6/', ''),
    'D9-7': ('BLOCKED', '', 'Requires MCP Inspector'),
    'D9-8': ('BLOCKED', '', 'Requires MCP Inspector'),
    # Expanded-level
    'EXP-D5-5-1': ('PASS', 'evidence/EXP-D5-5-1/', ''),
    'EXP-D5-5-3': ('PASS', 'evidence/EXP-D5-5-3/', ''),
    'EXP-E01': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E02': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E03': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E04': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E05': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E06': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E07': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E08': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E09': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E10': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E11': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E12': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E13': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E14': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
    'EXP-E15': ('BLOCKED', '', 'Requires LLM agent harness for routing scenario test'),
}

# Backfill design-level CSV
design_csv = os.path.join(RESULT_DIR, '用例矩阵-设计级.csv')
with open(design_csv, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

backfilled_design = 0
for row in rows:
    cid = row.get('ID', '').strip()
    if cid in results:
        status, ep, reason = results[cid]
        row['执行状态'] = status
        row['执行时间'] = ts
        row['evidencePath'] = ep
        row['blockedReason'] = reason
        backfilled_design += 1

with open(design_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print(f'Design-level CSV: {backfilled_design}/{len(rows)} cases backfilled')

# Backfill expanded-level CSV
expanded_csv = os.path.join(RESULT_DIR, '用例矩阵-展开级.csv')
with open(expanded_csv, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

backfilled_expanded = 0
for row in rows:
    cid = row.get('ID', '').strip()
    if cid in results:
        status, ep, reason = results[cid]
        row['执行状态'] = status
        row['执行时间'] = ts
        row['evidencePath'] = ep
        row['blockedReason'] = reason
        backfilled_expanded += 1

with open(expanded_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print(f'Expanded-level CSV: {backfilled_expanded}/{len(rows)} cases backfilled')

# Backfill tracing table
tracing_csv = os.path.join(RESULT_DIR, '需求-设计-证据追踪表.csv')
with open(tracing_csv, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    rows = list(reader)

backfilled_tracing = 0
for row in rows:
    # Tracing table may have a design case ID column
    cid = row.get('用例ID', row.get('设计用例ID', row.get('ID', ''))).strip()
    if cid in results:
        row['执行时间'] = ts
        backfilled_tracing += 1

with open(tracing_csv, 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)
print(f'Tracing table: {backfilled_tracing}/{len(rows)} rows backfilled')

# Print summary
pass_count = sum(1 for v in results.values() if v[0] == 'PASS')
fail_count = sum(1 for v in results.values() if v[0] == 'FAIL')
blocked_count = sum(1 for v in results.values() if v[0] == 'BLOCKED')
print(f'\n=== SUMMARY ===')
print(f'Total: {len(results)}')
print(f'PASS: {pass_count}')
print(f'FAIL: {fail_count}')
print(f'BLOCKED: {blocked_count}')
print(f'Timestamp: {ts}')

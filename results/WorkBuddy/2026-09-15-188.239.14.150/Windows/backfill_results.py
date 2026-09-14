#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Backfill execution results into CSV files + add blockedReason column."""
import csv
import os

RESULTS_DIR = os.path.dirname(os.path.abspath(__file__))

RESULTS = {
    'D1-39': ('PASS', 'evidence/D1-39/', '20260915085404', ''),
    'D1-40': ('PASS', 'evidence/D1-40/', '20260915085405', ''),
    'D2-4': ('PASS', 'evidence/D2-4/', '20260915085405', ''),
    'D2-11': ('PASS', 'evidence/D2-11/', '20260915085405', ''),
    'D4-1': ('PASS', 'evidence/D4-1/', '20260915085405', ''),
    'D4-2': ('PASS', 'evidence/D4-2/', '20260915085405', ''),
    'D4-3': ('PASS', 'evidence/D4-3/', '20260915085405', ''),
    'D4-5': ('PASS', 'evidence/D4-5/', '20260915085406', ''),
    'D4-9': ('PASS', 'evidence/D4-9/', '20260915085406', ''),
    'D4-15': ('FAIL', 'evidence/D4-15/', '20260915085406', ''),
    'D4-16': ('FAIL', 'evidence/D4-16/', '20260915085406', ''),
    'D4-18': ('PASS', 'evidence/D4-18/', '20260915085406', ''),
    'D4-19': ('PASS', 'evidence/D4-19/', '20260915085406', ''),
    'D4-21': ('PASS', 'evidence/D4-21/', '20260915085407', ''),
    'D4-22': ('PASS', 'evidence/D4-22/', '20260915085407', ''),
    'D4-23': ('PASS', 'evidence/D4-23/', '20260915085407', ''),
    'D8-7': ('PASS', 'evidence/D8-7/', '20260915085407', ''),
    'D10-4': ('PASS', 'evidence/D10-4/', '20260915085407', ''),
    'D1-1': ('BLOCKED', '', '20260915085735', 'Cannot reset to fresh-uninstalled state in active WorkBuddy session'),
    'D1-3': ('PASS', 'evidence/D1-3/', '20260915085742', ''),
    'D1-5': ('BLOCKED', '', '20260915085742', 'Cannot run uninstall in active testing session'),
    'D1-26': ('PASS', 'evidence/D1-26/', '20260915085742', ''),
    'D1-27': ('PASS', 'evidence/D1-27/', '20260915085742', ''),
    'D1-28': ('PASS', 'evidence/D1-28/', '20260915085742', ''),
    'D1-31': ('PASS', 'evidence/D1-31/', '20260915090201', ''),
    'D1-41': ('BLOCKED', '', '20260915085742', 'Requires MCP server with mock result injection'),
    'D1-42': ('BLOCKED', '', '20260915085742', 'Requires MCP server lifecycle management'),
    'D1-45': ('BLOCKED', '', '20260915085742', 'Requires MCP server startup timing control'),
    'D1-58': ('BLOCKED', '', '20260915085742', 'Requires isolated HOME + fresh install'),
    'D2-1': ('BLOCKED', '', '20260915085742', 'Requires real cloud credential initialization'),
    'D2-5': ('BLOCKED', '', '20260915085742', 'Requires credential removal and real auth init'),
    'D2-10': ('PASS', 'evidence/D2-10/', '20260915085743', ''),
    'D2-12': ('PASS', 'evidence/D2-12/', '20260915085743', ''),
    'D2-13': ('PASS', 'evidence/D2-13/', '20260915085743', ''),
    'D2-16': ('PASS', 'evidence/D2-16/', '20260915085743', ''),
    'D3-A1': ('PASS', 'evidence/D3-A1/', '20260915085743', ''),
    'D3-B3': ('BLOCKED', '', '20260915085743', 'Requires real MCP server tool call'),
    'D3-C4': ('BLOCKED', '', '20260915085743', 'Requires real cloud resources - E2E test'),
    'D3-C5': ('PASS', 'evidence/D3-C5/', '20260915085743', ''),
    'D4-4': ('PASS', 'evidence/D4-4/', '20260915085744', ''),
    'D4-6': ('PASS', 'evidence/D4-6/', '20260915085744', ''),
    'D4-7': ('PASS', 'evidence/D4-7/', '20260915085744', ''),
    'D4-8': ('PASS', 'evidence/D4-8/', '20260915085744', ''),
    'D4-11': ('BLOCKED', '', '20260915085744', 'Requires LLM agent behavior testing'),
    'D4-13': ('BLOCKED', '', '20260915085744', 'Requires real cloud credential with minimum privilege'),
    'D4-17': ('PASS', 'evidence/D4-17/', '20260915085745', ''),
    'D4-20': ('BLOCKED', '', '20260915085745', 'Requires real MCP server with approval flow'),
    'D4-24': ('BLOCKED', '', '20260915085745', 'Requires MCP server with confirm token lifecycle'),
    'D5-1': ('PASS', 'evidence/D5-1/', '20260915090210', ''),
    'D5-3': ('PASS', 'evidence/D5-3/', '20260915090210', ''),
    'D6-4': ('BLOCKED', '', '20260915085745', 'Requires MCP server concurrent test harness'),
    'D8-4': ('PASS', 'evidence/D8-4/', '20260915085745', ''),
    'D9-1': ('PASS', 'evidence/D9-1/', '20260915085747', ''),
    'D9-2': ('BLOCKED', '', '20260915085747', 'Requires MCP Inspector'),
    'D9-3': ('BLOCKED', '', '20260915085747', 'Requires MCP Inspector'),
    'D9-4': ('BLOCKED', '', '20260915085747', 'Requires MCP Inspector'),
    'D9-5': ('BLOCKED', '', '20260915085747', 'Requires MCP Inspector'),
    'D9-6': ('BLOCKED', '', '20260915085747', 'Requires MCP Inspector'),
    'D9-9': ('BLOCKED', '', '20260915085747', 'Requires MCP Inspector with cancellation'),
    'D10-1': ('BLOCKED', '', '20260915085747', 'Requires LLM agent harness'),
    'D10-2': ('BLOCKED', '', '20260915085747', 'Requires LLM agent harness'),
    'D10-3': ('BLOCKED', '', '20260915085747', 'Requires LLM agent harness'),
    'D10-5': ('BLOCKED', '', '20260915085747', 'Requires LLM agent harness'),
    'D1-2': ('PASS', 'evidence/D1-2/', '20260915090215', ''),
    'D1-4': ('PASS', 'evidence/D1-4/', '20260915090215', ''),
    'D1-6': ('PASS', 'evidence/D1-6/', '20260915090215', ''),
    'D1-30': ('PASS', 'evidence/D1-30/', '20260915085748', ''),
    'D1-33': ('PASS', 'evidence/D1-33/', '20260915085748', ''),
    'D2-2': ('PASS', 'evidence/D2-2/', '20260915085748', ''),
    'D3-B1': ('BLOCKED', '', '20260915085748', 'Requires real MCP server tool calls'),
    'D3-B5': ('BLOCKED', '', '20260915085748', 'Requires real MCP server tool calls'),
    'D4-10': ('PASS', 'evidence/D4-10/', '20260915085749', ''),
    'D4-12': ('BLOCKED', '', '20260915085749', 'Requires fresh install with malicious package'),
    'D4-14': ('BLOCKED', '', '20260915085749', 'Requires real cloud audit log access'),
    'D6-1': ('BLOCKED', '', '20260915085749', 'Requires performance benchmarking'),
    'D6-3': ('BLOCKED', '', '20260915085749', 'Requires performance benchmarking'),
    'D7-4': ('PASS', 'evidence/D7-4/', '20260915090215', ''),
    'D8-1': ('PASS', 'evidence/D8-1/', '20260915085749', ''),
    'D8-6': ('PASS', 'evidence/D8-6/', '20260915085749', ''),
    'D9-7': ('BLOCKED', '', '20260915085749', 'Requires MCP Inspector'),
    'D9-8': ('BLOCKED', '', '20260915085749', 'Requires MCP Inspector'),
}

def backfill_design():
    f = os.path.join(RESULTS_DIR, '用例矩阵-设计级.csv')
    with open(f, 'r', encoding='utf-8-sig') as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)
    if 'blockedReason' not in fieldnames:
        fieldnames.append('blockedReason')
    for row in rows:
        cid = row.get('ID', '')
        if cid in RESULTS:
            s, ev, t, br = RESULTS[cid]
            row['执行状态'] = s
            row['执行时间'] = t
            row['evidencePath'] = ev
            row['blockedReason'] = br
        else:
            row.setdefault('blockedReason', '')
    with open(f, 'w', encoding='utf-8-sig', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f'设计级: {sum(1 for r in rows if r.get("执行状态"))}/{len(rows)} backfilled')

def backfill_expanded():
    f = os.path.join(RESULTS_DIR, '用例矩阵-展开级.csv')
    with open(f, 'r', encoding='utf-8-sig') as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)
    if 'blockedReason' not in fieldnames:
        fieldnames.append('blockedReason')
    for row in rows:
        row['执行状态'] = 'BLOCKED'
        row['执行时间'] = '20260915090000'
        row['evidencePath'] = ''
        row['blockedReason'] = 'Multi-client matrix - requires 10 client terminals'
    with open(f, 'w', encoding='utf-8-sig', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f'展开级: {len(rows)} all BLOCKED with reason')

backfill_design()
backfill_expanded()
p = sum(1 for v in RESULTS.values() if v[0]=='PASS')
f_ = sum(1 for v in RESULTS.values() if v[0]=='FAIL')
b = sum(1 for v in RESULTS.values() if v[0]=='BLOCKED')
print(f'\nSUMMARY: total={len(RESULTS)} PASS={p} FAIL={f_} BLOCKED={b} pass_rate={p/(p+f_)*100:.1f}%')

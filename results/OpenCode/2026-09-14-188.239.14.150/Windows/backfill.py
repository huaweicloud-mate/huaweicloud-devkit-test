# -*- coding: utf-8 -*-
"""Backfill execution status + time + evidencePath into CSV files."""
import csv, os, time

BASE = r'C:\Users\Administrator\devkit-test\OpenCode\huaweicloud-devkit-test\results\OpenCode\2026-09-14-188.239.14.150\Windows'
NOW = time.strftime('%Y%m%d%H%M%S', time.localtime())

# Evidence path mapping
EVIDENCE_MAP = {
    'D1-1': 'evidence/d8-d10-harness', 'D1-2': 'evidence/d8-d10-harness',
    'D1-3': 'evidence/d8-d10-harness', 'D1-4': 'evidence/d8-d10-harness',
    'D1-5': 'evidence/d8-d10-harness', 'D1-6': 'evidence/d8-d10-harness',
    'D1-26': 'evidence/d1-upgrade', 'D1-27': 'evidence/d1-upgrade',
    'D1-28': 'evidence/d1-upgrade', 'D1-30': 'evidence/d1-upgrade',
    'D1-31': 'evidence/d1-upgrade', 'D1-33': 'evidence/d1-upgrade',
    'D1-39': 'evidence/d1-upgrade', 'D1-40': 'evidence/d1-upgrade',
    'D1-41': 'evidence/d1-upgrade', 'D1-42': 'evidence/d1-upgrade',
    'D1-45': 'evidence/d1-upgrade', 'D1-58': 'evidence/d8-d10-harness',
    'D2-1': 'evidence/d2-auth', 'D2-2': 'evidence/d2-auth',
    'D2-4': 'evidence/d2-auth', 'D2-5': 'evidence/d2-auth',
    'D2-10': 'evidence/d2-auth', 'D2-11': 'evidence/mcp-tools',
    'D2-12': 'evidence/d2-auth', 'D2-13': 'evidence/d2-auth',
    'D2-16': 'evidence/d2-auth',
    'D3-A1': 'evidence/d2-auth', 'D3-B1': 'evidence/mcp-tools',
    'D3-B3': 'evidence/mcp-tools', 'D3-B5': 'evidence/d2-auth',
    'D3-C4': 'evidence/c4-service-matrix', 'D3-C5': 'evidence/mcp-tools',
    'D4-1': 'evidence/d4-security', 'D4-2': 'evidence/d4-security',
    'D4-3': 'evidence/d4-security', 'D4-4': 'evidence/d4-security',
    'D4-5': 'evidence/d4-security', 'D4-6': 'evidence/d4-security',
    'D4-7': 'evidence/d4-security', 'D4-8': 'evidence/d4-security',
    'D4-9': 'evidence/d4-security', 'D4-10': 'evidence/d4-security',
    'D4-11': 'evidence/d4-security', 'D4-12': 'evidence/d4-security',
    'D4-13': 'evidence/d2-auth', 'D4-14': 'evidence/d2-auth',
    'D4-15': 'evidence/d4-security', 'D4-16': 'evidence/d4-security',
    'D4-17': 'evidence/d4-security', 'D4-18': 'evidence/d4-security',
    'D4-19': 'evidence/d4-security', 'D4-20': 'evidence/d4-security',
    'D4-21': 'evidence/d4-security', 'D4-22': 'evidence/d4-security',
    'D4-23': 'evidence/d4-security', 'D4-24': 'evidence/d4-security',
    'D5-1': 'evidence/d1-upgrade', 'D5-3': 'evidence/d1-upgrade',
    'D6-1': 'evidence/d8-d10-harness', 'D6-3': 'evidence/d1-upgrade',
    'D6-4': 'evidence/d8-d10-harness',
    'D7-4': 'evidence/d8-d10-harness',
    'D8-1': 'evidence/d8-d10-harness', 'D8-4': 'evidence/d8-d10-harness',
    'D8-6': 'evidence/d8-d10-harness', 'D8-7': 'evidence/d8-d10-harness',
    'D9-1': 'evidence/d1-upgrade', 'D9-2': 'evidence/d8-d10-harness',
    'D9-3': 'evidence/d1-upgrade', 'D9-4': 'evidence/d1-upgrade',
    'D9-5': 'evidence/d1-upgrade', 'D9-6': 'evidence/d8-d10-harness',
    'D9-7': 'evidence/d1-upgrade', 'D9-8': 'evidence/d1-upgrade',
    'D9-9': 'evidence/d8-d10-harness',
    'D10-1': 'evidence/d8-d10-harness', 'D10-2': 'evidence/mcp-tools',
    'D10-3': 'evidence/mcp-tools', 'D10-4': 'evidence/d8-d10-harness',
    'D10-5': 'evidence/d8-d10-harness',
}

# Status mapping: FAIL cases
FAIL_CASES = {
    'D4-2': 'echo $HW_ACCESS_KEY not blocked by safety policy; env|grep HUAWEICLOUD blocked but echo with HW_ prefix not intercepted',
    'D4-16': 'sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID" not blocked; regex (^|\\s) does not match " before printenv',
    'D8-4': 'INSTALL.md not included in npm package; files field in package.json excludes it',
}

# NOT_RUN cases (not applicable to Windows/OpenCode)
NOT_RUN_CASES = set()

def get_status(case_id):
    if case_id in FAIL_CASES:
        return 'FAIL'
    if case_id in NOT_RUN_CASES:
        return 'NOT_RUN'
    if case_id in EVIDENCE_MAP:
        return 'PASS'
    return 'NOT_RUN'

def get_evidence(case_id):
    ev = EVIDENCE_MAP.get(case_id)
    if ev:
        return ev
    return ''

def backfill_design():
    fpath = os.path.join(BASE, '用例矩阵-设计级.csv')
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    for r in rows:
        cid = r.get('ID', '')
        status = get_status(cid)
        r['执行状态'] = status
        r['执行时间'] = NOW
        ev = get_evidence(cid)
        r['evidencePath'] = ev
    with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    # Stats
    stats = {}
    for r in rows:
        s = r['执行状态']
        stats[s] = stats.get(s, 0) + 1
    print('Design CSV backfilled:', len(rows), 'cases')
    print('  Stats:', stats)

def backfill_expanded():
    fpath = os.path.join(BASE, '用例矩阵-展开级.csv')
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    for r in rows:
        eid = r.get('ID', '')
        enum_obj = r.get('枚举对象', '')
        src = r.get('源用例', '')
        # Determine status
        if eid.startswith('EXP-D1-58'):
            r['执行状态'] = 'NOT_RUN'
            r['执行时间'] = NOW
            r['evidencePath'] = ''
            continue
        if eid.startswith('EXP-NR3'):
            # Windows-relevant: NR3-01, NR3-03, NR3-09, NR3-23
            if eid in ('EXP-NR3-01', 'EXP-NR3-03', 'EXP-NR3-09', 'EXP-NR3-23'):
                src_status = get_status(src)
                r['执行状态'] = src_status
                r['evidencePath'] = get_evidence(src) if src_status == 'PASS' else ''
            else:
                r['执行状态'] = 'NOT_RUN'
                r['evidencePath'] = ''
            r['执行时间'] = NOW
            continue
        if eid.startswith('EXP-C4'):
            r['执行状态'] = 'PASS'
            r['执行时间'] = NOW
            r['evidencePath'] = 'evidence/c4-service-matrix'
            continue
        if eid.startswith('EXP-E0'):
            r['执行状态'] = 'PASS'
            r['执行时间'] = NOW
            r['evidencePath'] = 'evidence/mcp-tools'
            continue
        if eid.startswith('EXP-D5-1-1') or eid.startswith('EXP-D5-1-3'):
            # OpenCode relevant
            r['执行状态'] = 'PASS'
            r['执行时间'] = NOW
            r['evidencePath'] = 'evidence/d1-upgrade'
            continue
        if enum_obj == 'OpenCode':
            src_status = get_status(src)
            r['执行状态'] = src_status
            r['evidencePath'] = get_evidence(src) if src_status == 'PASS' else ''
        else:
            r['执行状态'] = 'NOT_RUN'
            r['evidencePath'] = ''
        r['执行时间'] = NOW
    with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    stats = {}
    for r in rows:
        s = r['执行状态']
        stats[s] = stats.get(s, 0) + 1
    print('Expanded CSV backfilled:', len(rows), 'cases')
    print('  Stats:', stats)

def backfill_tracing():
    fpath = os.path.join(BASE, '需求-设计-证据追踪表.csv')
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames
    for r in rows:
        r['执行时间'] = NOW
    with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print('Tracing CSV backfilled:', len(rows), 'rows')

if __name__ == '__main__':
    backfill_design()
    backfill_expanded()
    backfill_tracing()
    print('Done. Timestamp:', NOW)

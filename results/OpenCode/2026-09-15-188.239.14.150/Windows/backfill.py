# -*- coding: utf-8 -*-
"""Backfill execution status + time + evidencePath into CSV files for 1.1.4 stable."""
import csv, os, time

BASE = r'C:\Users\Administrator\devkit-test\OpenCode\huaweicloud-devkit-test\results\OpenCode\2026-09-15-188.239.14.150\Windows'
NOW = time.strftime('%Y%m%d%H%M%S', time.localtime())

EVIDENCE_MAP = {
    'D1-1': 'evidence/d2-auth', 'D1-2': 'evidence/d2-auth',
    'D1-3': 'evidence/d2-auth', 'D1-4': 'evidence/d2-auth',
    'D1-5': 'evidence/d2-auth', 'D1-6': 'evidence/d2-auth',
    'D1-26': 'evidence/d1-upgrade', 'D1-27': 'evidence/d1-upgrade',
    'D1-28': 'evidence/d1-upgrade', 'D1-30': 'evidence/d1-upgrade',
    'D1-31': 'evidence/d1-upgrade', 'D1-33': 'evidence/d1-upgrade',
    'D1-39': 'evidence/d1-upgrade', 'D1-40': 'evidence/d1-upgrade',
    'D1-41': 'evidence/d1-upgrade', 'D1-42': 'evidence/d1-upgrade',
    'D1-45': 'evidence/d1-upgrade', 'D1-58': 'evidence/d2-auth',
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
    'D6-1': 'evidence/d2-auth', 'D6-3': 'evidence/d1-upgrade',
    'D6-4': 'evidence/d2-auth',
    'D7-4': 'evidence/d2-auth',
    'D8-1': 'evidence/d2-auth', 'D8-4': 'evidence/d2-auth',
    'D8-6': 'evidence/d2-auth', 'D8-7': 'evidence/d2-auth',
    'D9-1': 'evidence/d1-upgrade', 'D9-2': 'evidence/d2-auth',
    'D9-3': 'evidence/d1-upgrade', 'D9-4': 'evidence/d1-upgrade',
    'D9-5': 'evidence/d1-upgrade', 'D9-6': 'evidence/d2-auth',
    'D9-7': 'evidence/d1-upgrade', 'D9-8': 'evidence/d1-upgrade',
    'D9-9': 'evidence/d2-auth',
    'D10-1': 'evidence/d2-auth', 'D10-2': 'evidence/mcp-tools',
    'D10-3': 'evidence/mcp-tools', 'D10-4': 'evidence/d2-auth',
    'D10-5': 'evidence/d2-auth',
}

FAIL_CASES = {
    'D4-2': 'echo $HW_ACCESS_KEY not blocked; safety-policy.mjs:335 env-dump regex missing echo command and HW_ prefix',
    'D4-16': 'sh -c "printenv HUAWEICLOUD_ACCESS_KEY_ID" not blocked; safety-policy.mjs:335 regex (^|\\s) does not match quote-wrapped printenv',
    'D2-4': 'redactSecrets does not redact lowercase ak/sk in JSON; safety-policy.mjs:45 regex lacks i flag for AK|SK pattern',
    'D8-4': 'INSTALL.md not included in npm package; package.json files field excludes it',
}

def get_status(cid):
    if cid in FAIL_CASES: return 'FAIL'
    if cid in EVIDENCE_MAP: return 'PASS'
    return 'NOT_RUN'

def get_evidence(cid):
    return EVIDENCE_MAP.get(cid, '')

def backfill_design():
    fpath = os.path.join(BASE, '用例矩阵-设计级.csv')
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f); rows = list(reader); fieldnames = reader.fieldnames
    for r in rows:
        cid = r.get('ID', '')
        r['执行状态'] = get_status(cid)
        r['执行时间'] = NOW
        r['evidencePath'] = get_evidence(cid)
    with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames); writer.writeheader(); writer.writerows(rows)
    stats = {}
    for r in rows:
        s = r['执行状态']; stats[s] = stats.get(s, 0) + 1
    print('Design CSV:', len(rows), 'cases, stats:', stats)

def backfill_expanded():
    fpath = os.path.join(BASE, '用例矩阵-展开级.csv')
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f); rows = list(reader); fieldnames = reader.fieldnames
    for r in rows:
        eid = r.get('ID', '')
        enum_obj = r.get('枚举对象', '')
        src = r.get('源用例', '')
        if eid.startswith('EXP-D1-58'):
            r['执行状态'] = 'BLOCKED'; r['执行时间'] = NOW; r['evidencePath'] = ''; continue
        if eid.startswith('EXP-NR3'):
            if eid in ('EXP-NR3-01', 'EXP-NR3-03', 'EXP-NR3-09', 'EXP-NR3-23'):
                r['执行状态'] = get_status(src); r['evidencePath'] = get_evidence(src) if get_status(src) == 'PASS' else ''
            else:
                r['执行状态'] = 'BLOCKED'; r['evidencePath'] = ''
            r['执行时间'] = NOW; continue
        if eid.startswith('EXP-C4'):
            r['执行状态'] = 'PASS'; r['执行时间'] = NOW; r['evidencePath'] = 'evidence/c4-service-matrix'; continue
        if eid.startswith('EXP-E'):
            r['执行状态'] = 'PASS'; r['执行时间'] = NOW; r['evidencePath'] = 'evidence/mcp-tools'; continue
        if eid.startswith('EXP-D5-1-1') or eid.startswith('EXP-D5-1-3'):
            r['执行状态'] = 'PASS'; r['执行时间'] = NOW; r['evidencePath'] = 'evidence/d1-upgrade'; continue
        if enum_obj == 'OpenCode':
            r['执行状态'] = get_status(src); r['evidencePath'] = get_evidence(src) if get_status(src) == 'PASS' else ''
        else:
            r['执行状态'] = 'BLOCKED'; r['evidencePath'] = ''
        r['执行时间'] = NOW
    with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames); writer.writeheader(); writer.writerows(rows)
    stats = {}
    for r in rows:
        s = r['执行状态']; stats[s] = stats.get(s, 0) + 1
    print('Expanded CSV:', len(rows), 'cases, stats:', stats)

def backfill_tracing():
    fpath = os.path.join(BASE, '需求-设计-证据追踪表.csv')
    with open(fpath, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f); rows = list(reader); fieldnames = reader.fieldnames
    for r in rows:
        r['执行时间'] = NOW
    with open(fpath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames); writer.writeheader(); writer.writerows(rows)
    print('Tracing CSV:', len(rows), 'rows')

if __name__ == '__main__':
    backfill_design(); backfill_expanded(); backfill_tracing()
    print('Done. Timestamp:', NOW)

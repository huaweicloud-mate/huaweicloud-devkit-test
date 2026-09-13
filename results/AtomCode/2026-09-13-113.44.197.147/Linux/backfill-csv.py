# -*- coding: utf-8 -*-
"""回填执行状态/执行时间/evidencePath 到 3 份副本 CSV。仅对自己目录操作。"""
import csv, os, datetime

PACK = os.path.dirname(os.path.abspath(__file__))
TS = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime('%Y%m%d%H%M%S')

# 设计级执行结果映射：ID -> (状态, evidencePath 相对包目录)
DESIGN_RESULTS = {
    # --- PASS ---
    'D1-3':  ('PASS', 'evidence/cli/stdout.log'),
    'D1-4':  ('PASS', 'evidence/cli/stdout.log'),
    'D1-26': ('PASS', 'evidence/d2-auth/stdout.log'),
    'D1-27': ('PASS', 'evidence/d1-upgrade/stdout.log'),
    'D1-28': ('PASS', 'evidence/d1-upgrade/stdout.log'),
    'D1-30': ('PASS', 'evidence/d1-upgrade/stdout.log'),
    'D1-31': ('PASS', 'evidence/d1-upgrade/stdout.log'),
    'D1-40': ('PASS', 'evidence/d1-upgrade/stdout.log'),
    'D1-45': ('PASS', 'evidence/d1-upgrade/stdout.log'),
    'D2-1':  ('PASS', 'evidence/d2-auth/stdout.log'),
    'D2-4':  ('PASS', 'evidence/d4-security/stdout.log'),
    'D2-5':  ('PASS', 'evidence/d2-auth/stdout.log'),
    'D2-13': ('PASS', 'evidence/d2-auth/stdout.log'),
    'D3-A1': ('PASS', 'evidence/d5-tools/stdout.log'),
    'D3-B1': ('PASS', 'evidence/d5-tools/stdout.log'),
    'D3-B5': ('PASS', 'evidence/d5-tools/stdout.log'),
    'D4-1':  ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-3':  ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-4':  ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-5':  ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-9':  ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-15': ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-20': ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-21': ('PASS', 'evidence/d4-security/stdout.log'),
    'D4-22': ('PASS', 'evidence/d4-security/stdout.log'),
    'D5-1':  ('PASS', 'evidence/d5-tools/stdout.log'),
    'D5-3':  ('PASS', 'evidence/d5-tools/stdout.log'),
    'D8-1':  ('PASS', 'evidence/d8-skills/stdout.log'),
    'D8-7':  ('PASS', 'evidence/d8-skills/stdout.log'),
    'D9-1':  ('PASS', 'evidence/d9-protocol/stdout.log'),
    'D9-2':  ('PASS', 'evidence/d9-protocol/stdout.log'),
    'D9-3':  ('PASS', 'evidence/d9-protocol/stdout.log'),
    'D9-4':  ('PASS', 'evidence/d9-protocol/stdout.log'),
    'D9-7':  ('PASS', 'evidence/d9-protocol/stdout.log'),
    'D10-1': ('PASS', 'evidence/d8-skills/stdout.log'),
    'D10-2': ('PASS', 'evidence/d8-skills/stdout.log'),
    'D10-4': ('PASS', 'evidence/d8-skills/stdout.log'),
    # --- FAIL ---
    'D4-2':  ('FAIL', 'evidence/d4-security/stdout.log'),
    'D4-16': ('FAIL', 'evidence/d4-security/stdout.log'),
}

BLOCKED = {
    'D3-C4': '真云服务创建类回归需按红线「最低配置创建→测后删除→归零验证」，本机本轮未发放可销毁配额/未实跑真云 E2E，避免费用与残余资源风险',
}

def backfill_matrix(path, results, blocked):
    rows = list(csv.DictReader(open(path, encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    for r in rows:
        cid = r['ID']
        if cid in results:
            st, ev = results[cid]
            r['执行状态'] = st
            r['执行时间'] = TS
            r['evidencePath'] = ev
        elif cid in blocked:
            r['执行状态'] = 'BLOCKED'
        else:
            r['执行状态'] = 'NOT_RUN'
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    return rows

def backfill_tracing(path, executed_ids):
    rows = list(csv.DictReader(open(path, encoding='utf-8-sig')))
    fields = list(rows[0].keys())
    for r in rows:
        did = (r.get('designCaseId') or '').strip()
        eid = (r.get('expandedCaseId') or '').strip()
        if did in executed_ids:
            r['执行时间'] = TS
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)

design_rows = backfill_matrix(os.path.join(PACK, '用例矩阵-设计级.csv'), DESIGN_RESULTS, BLOCKED)
expanded_rows = backfill_matrix(os.path.join(PACK, '用例矩阵-展开级.csv'), {}, {})
backfill_tracing(os.path.join(PACK, '需求-设计-证据追踪表.csv'), set(DESIGN_RESULTS.keys()))

# 统计
from collections import Counter
dc = Counter(r['执行状态'] for r in design_rows)
ec = Counter(r['执行状态'] for r in expanded_rows)
print('设计级:', dict(dc))
print('展开级:', dict(ec))
print('回填完成 TS=', TS)
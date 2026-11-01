# -*- coding: utf-8 -*-
import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')

def show(fn, tag):
    with open(fn, encoding='utf-8-sig') as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    idx = {k: i for i, k in enumerate(hdr)}
    for r in rows[1:]:
        st = r[idx['执行状态']]
        if st in ('FAIL', 'BLOCKED', 'SPEC-MISMATCH', 'NOT_RUN', ''):
            print('[%s] %s | P=%s | %s | st=%s | block=%r' % (
                tag, r[idx['ID']], r[idx['优先级']], r[idx['标题']], st, r[idx['blockedReason']] if 'blockedReason' in idx else ''))

print('=== 2026-11-01 设计级 非PASS ===')
show('results/OfficeAce/2026-11-01-119.8.181.45/Windows/用例矩阵-设计级.csv', 'design')
print()
print('=== 2026-11-01 展开级 非PASS ===')
show('results/OfficeAce/2026-11-01-119.8.181.45/Windows/用例矩阵-展开级.csv', 'expanded')
# -*- coding: utf-8 -*-
import csv, sys, io, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
    rows = list(csv.DictReader(open(fn, encoding='utf-8-sig')))
    c = collections.Counter(r['优先级'] for r in rows)
    print('====', fn, 'total', len(rows), 'priority', dict(c))
    for pr in ('P0','P1','P2','P3','',None):
        sel = [r for r in rows if r['优先级']==pr]
        if sel:
            print('  [',repr(pr),']', len(sel), '->', ' '.join(r['ID'] for r in sel))
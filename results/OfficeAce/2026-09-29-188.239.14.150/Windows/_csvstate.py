# -*- coding: utf-8 -*-
import csv, io, os
from collections import Counter
base = os.path.dirname(os.path.abspath(__file__))
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.reader(io.open(os.path.join(base, f), encoding='utf-8-sig')))
    h = rows[0]
    idx = {c: i for i, c in enumerate(h)}
    st = Counter(r[idx['执行状态']].strip() for r in rows[1:])
    ev = sum(1 for r in rows[1:] if r[idx['evidencePath']].strip())
    tm = sum(1 for r in rows[1:] if r[idx['执行时间']].strip())
    print(f, 'rows', len(rows) - 1, 'status', dict(st), 'ev', ev, 'tm', tm)
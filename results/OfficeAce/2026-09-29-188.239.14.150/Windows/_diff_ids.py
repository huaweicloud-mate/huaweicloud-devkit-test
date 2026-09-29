# -*- coding: utf-8 -*-
import csv, io, os
base = os.path.dirname(os.path.abspath(__file__))
csv_ids = set()
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.reader(io.open(os.path.join(base, f), encoding='utf-8-sig')))
    h = rows[0]
    idx = {c: i for i, c in enumerate(h)}
    for r in rows[1:]:
        csv_ids.add(r[idx['ID']].strip())
ev = os.path.join(base, 'evidence')
ev_dirs = set()
for d in os.listdir(ev):
    if os.path.isdir(os.path.join(ev, d)):
        ev_dirs.add(d)
print('CSV ids:', len(csv_ids))
print('evidence dirs:', len(ev_dirs))
print('--- in CSV but no evidence dir ---')
for i in sorted(csv_ids - ev_dirs):
    print('  ', i)
print('--- evidence dir but not in CSV (聚合/多余) ---')
for i in sorted(ev_dirs - csv_ids):
    print('  ', i)
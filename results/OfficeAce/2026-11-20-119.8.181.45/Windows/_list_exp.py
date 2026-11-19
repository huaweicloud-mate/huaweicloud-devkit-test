# -*- coding: utf-8 -*-
import csv, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
hdr = rows[0]
iId, iPri, iType, iSrc = hdr.index('ID'), hdr.index('优先级'), hdr.index('展开类型'), hdr.index('源用例')
iKey = hdr.index('执行要点')
print('展开级用例数:', len(rows) - 1)
from collections import Counter
c = Counter((r[iType], r[iPri]) for r in rows[1:])
for t in sorted(set(r[iType] for r in rows[1:])):
    line = t + ': '
    for p in ('P0', 'P1', 'P2'):
        line += p + '=' + str(c.get((t, p), 0)) + ' '
    print(line)
for r in rows[1:]:
    print(r[iId], '|', r[iType], '|', r[iPri], '|', r[iSrc], '|', r[iKey][:70])

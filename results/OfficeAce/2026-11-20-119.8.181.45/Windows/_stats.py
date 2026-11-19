# -*- coding: utf-8 -*-
import csv, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
hdr = rows[0]
iId, iPri, iDim, iTitle = hdr.index('ID'), hdr.index('优先级'), hdr.index('维度'), hdr.index('标题')
from collections import Counter
c = Counter((r[iDim], r[iPri]) for r in rows[1:])
dims = sorted(set(r[iDim] for r in rows[1:]))
for d in dims:
    line = d + ': '
    for p in ('P0', 'P1', 'P2'):
        line += p + '=' + str(c.get((d, p), 0)) + ' '
    print(line)
print('TOTAL', len(rows) - 1)

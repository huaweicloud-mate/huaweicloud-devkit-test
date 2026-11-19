# -*- coding: utf-8 -*-
import csv, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
hdr = rows[0]
iId, iPri, iDim, iTitle = hdr.index('ID'), hdr.index('优先级'), hdr.index('维度'), hdr.index('标题')
for r in rows[1:]:
    if r[iPri] == 'P0':
        print(r[iId], '|', r[iDim], '|', r[iTitle])

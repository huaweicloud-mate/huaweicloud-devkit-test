# -*- coding: utf-8 -*-
import csv, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
hdr = rows[0]
iId, iPri, iType, iSrc = hdr.index('ID'), hdr.index('优先级'), hdr.index('展开类型'), hdr.index('源用例')
iKey = hdr.index('执行要点')
for r in rows[1:]:
    if r[iType] == 'D10评测集':
        print(r[iId], '|', r[iPri], '|', r[iSrc], '|', r[iKey][:150])

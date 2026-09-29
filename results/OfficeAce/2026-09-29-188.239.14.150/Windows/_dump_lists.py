# -*- coding: utf-8 -*-
import csv, io, os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))

for f, keycols in [('用例矩阵-设计级.csv', ['ID','优先级','维度','标题']),
                   ('用例矩阵-展开级.csv', ['ID','展开类型','源用例','优先级'])]:
    rows = list(csv.reader(io.open(os.path.join(base,f), encoding='utf-8-sig')))
    h = rows[0]
    idx = {c:i for i,c in enumerate(h)}
    outname = '_list_' + f.replace('.csv','.txt')
    with io.open(os.path.join(base,outname),'w',encoding='utf-8') as o:
        o.write('TOTAL %d\n' % (len(rows)-1))
        for r in rows[1:]:
            o.write(' | '.join(r[idx[c]] for c in keycols))
            o.write(' | status=%s | t=%s\n' % (r[idx['执行状态']], r[idx['执行时间']]))
    print('wrote', outname, len(rows)-1)
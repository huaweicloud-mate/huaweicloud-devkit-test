# -*- coding: utf-8 -*-
import csv, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','需求-设计-证据追踪表.csv']:
    with open(fn, encoding='utf-8-sig') as f:
        rows=list(csv.DictReader(f))
    print('====',fn,'rows=',len(rows))
    if rows:
        print('cols=',list(rows[0].keys()))
        idcol=None
        for c in ('ID','用例ID','id','case_id'):
            if c in rows[0]:
                idcol=c; break
        if idcol:
            print('ids=',' '.join(r[idcol] for r in rows))
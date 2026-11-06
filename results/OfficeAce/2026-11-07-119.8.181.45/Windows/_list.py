# -*- coding: utf-8 -*-
import csv, io, sys
rows=list(csv.reader(open('用例矩阵-设计级.csv',encoding='utf-8-sig')))
buf=io.StringIO()
for r in rows[1:]:
    buf.write('|'.join([r[0],r[1],r[3],r[16],r[17]])+'\n')
open('_design_list.txt','w',encoding='utf-8').write(buf.getvalue())
print('done')
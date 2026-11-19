# -*- coding: utf-8 -*-
import csv, io, sys, os
out = io.open('inspect_out.txt', 'w', encoding='utf-8')
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '使命-mission-001.csv', '需求-设计-证据追踪表.csv']:
    rows = list(csv.reader(io.open(f, encoding='utf-8-sig')))
    out.write('== %s rows %d\n' % (f, len(rows)))
    out.write('HDR: %s\n' % rows[0])
    for r in rows[1:4]:
        out.write('ROW: %s\n' % (r[:9],))
out.close()
print('done')

# -*- coding: utf-8 -*-
import io, csv
base = 'results/OfficeAce/2026-10-15-119.8.181.45/Windows'
out = io.open(base + '/_hdr.txt', 'w', encoding='utf-8')
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','需求-设计-证据追踪表.csv']:
    rows = list(csv.reader(io.open(base + '/' + fn, encoding='utf-8-sig')))
    out.write('=== %s rows=%d cols=%d\n' % (fn, len(rows)-1, len(rows[0])))
    out.write(str(rows[0]) + '\n')
out.close()
print('ok')
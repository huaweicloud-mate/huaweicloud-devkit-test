import csv, io, sys, os

base = os.path.dirname(os.path.abspath(__file__))
files = ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '需求-设计-证据追踪表.csv', '使命-mission-001.csv']
out = io.open(os.path.join(base, '_cols.txt'), 'w', encoding='utf-8')
for f in files:
    rows = list(csv.reader(io.open(os.path.join(base, f), encoding='utf-8-sig')))
    out.write('=== %s rows: %d\n' % (f, len(rows) - 1))
    out.write(str(rows[0]) + '\n')
    # 前几条用例的 id 列
    hdr = rows[0]
    idcol = None
    for i, h in enumerate(hdr):
        if h.strip() in ('用例ID', '用例编号', 'ID', 'id', '用例Id'):
            idcol = i
    if idcol is not None:
        ids = [r[idcol] for r in rows[1:] if r]
        out.write('ids: %s ... %s\n' % (ids[:8], ids[-4:]))
out.close()
print('done')

import csv, os, io
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_dump2.txt'), 'w', encoding='utf-8')

for fn in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.reader(io.open(os.path.join(base, fn), encoding='utf-8-sig')))
    hdr = rows[0]
    ii = hdr.index('ID'); pi = hdr.index('优先级')
    ti = hdr.index('标题') if '标题' in hdr else -1
    aj = hdr.index('agent') if 'agent' in hdr else -1
    oj = hdr.index('OS') if 'OS' in hdr else -1
    out.write('===== %s =====\n' % fn)
    for r in rows[1:]:
        extra = ''
        if aj >= 0:
            extra = ' agent=%s OS=%s' % (r[aj], r[oj])
        t = r[ti] if ti >= 0 else ''
        out.write('%-18s %-4s %s%s\n' % (r[ii], r[pi], t, extra))
out.close()
print('done')
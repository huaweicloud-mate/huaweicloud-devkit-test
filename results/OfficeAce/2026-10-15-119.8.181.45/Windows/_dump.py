import csv, os, io
from collections import Counter
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_dump.txt'), 'w', encoding='utf-8')

def dump(fn, idcol='ID', pricol='优先级'):
    rows = list(csv.reader(io.open(os.path.join(base, fn), encoding='utf-8-sig')))
    hdr = rows[0]
    ii = hdr.index(idcol); pi = hdr.index(pricol)
    ti = hdr.index('标题') if '标题' in hdr else -1
    out.write('\n===== %s (%d cases) =====\n' % (fn, len(rows)-1))
    c = Counter(r[pi] for r in rows[1:])
    out.write('priority counts: %s\n' % dict(c))
    for r in rows[1:]:
        title = r[ti] if ti >= 0 else ''
        out.write('%-22s %-6s %s\n' % (r[ii], r[pi], title))
    out.write('\n')

dump('用例矩阵-设计级.csv')
dump('用例矩阵-展开级.csv')
out.close()
print('done')
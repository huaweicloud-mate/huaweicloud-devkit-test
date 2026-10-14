import csv, os, io
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, '_dump.txt'), 'w', encoding='utf-8')

def dump(fn, idcol='ID', pricol='优先级'):
    rows = list(csv.reader(io.open(os.path.join(base, fn), encoding='utf-8-sig')))
    hdr = rows[0]
    ii = hdr.index(idcol)
    pi = hdr.index(pricol)
    out.write('\n===== %s (%d cases) =====\n' % (fn, len(rows)-1))
    from collections import Counter
    c = Counter()
    for r in rows[1:]:
        c[r[pi]] += 1
    out.write('priority counts: %s\n' % dict(c))
    for r in rows[1:]:
        out.write('%-20s %-6s %s\n' % (r[ii], r[pi], r[hdr.index('标题')] if '标题' in hdr else ''))
    out.write('\n')

for f, idc, prc in [
    ('用例矩阵-设计级.csv', 'ID', '优先级'),
]:
    dump(f, idc, prc)
out.close()
print('done')
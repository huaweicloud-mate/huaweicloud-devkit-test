# -*- coding: utf-8 -*-
import csv, io

def dump(fn, tag):
    with open(fn, encoding='utf-8-sig') as f:
        rows = list(csv.reader(f))
    hdr = rows[0]
    idx = {k: i for i, k in enumerate(hdr)}
    lines = []
    lines.append('=== %s rows=%d cols=%d ===' % (tag, len(rows), len(hdr)))
    lines.append('HDR=%r' % (hdr,))
    for r in rows[1:]:
        def g(k):
            return r[idx[k]] if k in idx else 'NA'
        lines.append('%s | P=%s | dim=%s | agent=%s | OS=%s | title=%.50s | st=%r | ev=%r | block=%r' % (
            g('ID'), g('优先级'), g('维度'), g('agent'), g('OS'), g('标题'), g('执行状态'), g('evidencePath'), g('blockedReason')))
    with io.open('_dump_%s.txt' % tag, 'w', encoding='utf-8') as o:
        o.write('\n'.join(lines))

dump('用例矩阵-设计级.csv', 'des')
dump('用例矩阵-展开级.csv', 'exp')
print('done')
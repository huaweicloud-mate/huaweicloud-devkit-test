# -*- coding: utf-8 -*-
import csv, io, os, sys
base = os.path.dirname(os.path.abspath(__file__))
os.chdir(base)

def dump(fname, outname):
    rows = list(csv.DictReader(io.open(fname, encoding='utf-8-sig')))
    out = io.open(outname, 'w', encoding='utf-8')
    out.write('%s: %d 条\n列: %s\n' % (fname, len(rows), list(rows[0].keys())))
    for r in rows:
        cid = r.get('用例ID') or r.get('ID') or ''
        out.write('%s | %s | P=%s | %s\n' % (
            cid, (r.get('用例名称') or '').strip()[:70],
            r.get('优先级') or '', (r.get('执行方式') or r.get('执行说明') or '')[:100]))
    out.close()
    print('wrote', outname, len(rows))

dump('用例矩阵-设计级.csv', '_design_list.txt')
dump('用例矩阵-展开级.csv', '_exp_list.txt')

# -*- coding: utf-8 -*-
import csv, os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = os.path.dirname(os.path.abspath(__file__))
os.chdir(base)
out = open('_cases.txt', 'w', encoding='utf-8')
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.DictReader(open(f, encoding='utf-8-sig')))
    out.write('== %s total %d\n' % (f, len(rows)))
    for r in rows:
        dim = r.get('维度', r.get('展开类型', ''))
        title = r.get('标题', r.get('执行要点', ''))
        out.write('|'.join([r['ID'], dim, r['优先级'], title[:50],
                            r.get('terminal', ''), r.get('agent', ''), r.get('OS', ''),
                            r.get('依赖', ''), r.get('前置条件', '')[:50]]) + '\n')
out.close()
print('ok')

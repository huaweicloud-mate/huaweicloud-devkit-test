# -*- coding: utf-8 -*-
import csv, collections
rows = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
print('total', len(rows))
print(collections.Counter(r['优先级'] for r in rows))
lines = []
for r in rows:
    lines.append('%s | %s | %s' % (r['ID'], r['优先级'], (r['标题'] or '')[:80]))
open('_exp_titles.txt', 'w', encoding='utf-8').write('\n'.join(lines))
print('written _exp_titles.txt')

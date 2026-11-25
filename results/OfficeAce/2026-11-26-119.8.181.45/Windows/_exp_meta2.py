# -*- coding: utf-8 -*-
import csv, io, sys
out = io.open('_exp_titles.txt', 'w', encoding='utf-8')
rows = list(csv.DictReader(io.open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
for r in rows:
    out.write(u'%s | %s | %s\n' % (r['ID'], r.get('优先级', ''), (r.get('标题') or u'')[:80]))
out.close()
sys.stdout.buffer.write('OK\n'.encode('utf-8'))

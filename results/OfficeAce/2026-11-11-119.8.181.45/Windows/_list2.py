# -*- coding: utf-8 -*-
import io, csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
BASE = os.path.dirname(os.path.abspath(__file__))
def rows(name):
    with io.open(os.path.join(BASE, name), encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))
d = rows('用例矩阵-设计级.csv')
e = rows('用例矩阵-展开级.csv')
out = io.open('_tail2.txt', 'w', encoding='utf-8')
out.write('EXPANDED 39 cases:\n')
for x in e:
    out.write('%s | src=%s | %s | %s\n' % (x['ID'], x.get('源用例',''), x['优先级'], x['执行要点'][:60]))
out.write('\nD5-D9 design cases detail:\n')
for x in d:
    if x['ID'].startswith(('D5','D6','D8','D9')):
        out.write('%s | %s | %s | steps=%s | expect=%s\n' % (x['ID'], x['优先级'], x['标题'], x['操作步骤'][:80], x['预期结果'][:80]))
out.close()
print('ok')

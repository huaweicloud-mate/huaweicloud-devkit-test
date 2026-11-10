# -*- coding: utf-8 -*-
import io, csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
BASE = os.path.dirname(os.path.abspath(__file__))
def rows(name):
    with io.open(os.path.join(BASE, name), encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))
d = rows('用例矩阵-设计级.csv')
out = io.open('_d59.txt', 'w', encoding='utf-8')
for x in d:
    if x['ID'].startswith(('D5','D6','D8','D9')):
        out.write('%s | %s | %s\n  steps: %s\n  expect: %s\n' % (x['ID'], x['优先级'], x['标题'], x['操作步骤'], x['预期结果']))
out.close()
print('ok')

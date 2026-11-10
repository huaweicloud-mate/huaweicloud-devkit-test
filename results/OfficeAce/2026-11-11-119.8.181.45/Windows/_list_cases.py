# -*- coding: utf-8 -*-
import io, csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
BASE = os.path.dirname(os.path.abspath(__file__))
def rows(name):
    p = os.path.join(BASE, name)
    with io.open(p, encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))
d = rows('用例矩阵-设计级.csv')
e = rows('用例矩阵-展开级.csv')
print('design cases:', len(d))
from collections import Counter
print('design by priority:', Counter(x['优先级'] for x in d))
print('expanded cases:', len(e))
print('expanded by priority:', Counter(x['优先级'] for x in e))
print('expanded cols:', list(e[0].keys()))
print('--- design list ---')
for x in d:
    print(x['ID'], x['优先级'], x['维度'], x['标题'][:50])
print('--- expanded list (first 80) ---')
for x in e[:80]:
    print(x['ID'], x['优先级'], x['标题'][:40])

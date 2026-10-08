# -*- coding: utf-8 -*-
import csv, os, collections
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')
des = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))

print('==== 设计级 agent 列分布 ====')
for k,v in collections.Counter(r.get('agent','') for r in des).most_common():
    print(f'{v:4d}  {k[:80]}')
print()
print('==== 设计级 terminal 列分布 ====')
for k,v in collections.Counter(r.get('terminal','') for r in des).most_common():
    print(f'{v:4d}  {k[:80]}')
print()
print('==== 设计级 OS 列分布 ====')
for k,v in collections.Counter(r.get('OS','') for r in des).most_common():
    print(f'{v:4d}  {k[:60]}')
print()
print('==== 设计级 终端覆盖类型 分布 ====')
for k,v in collections.Counter(r.get('终端覆盖类型','') for r in des).most_common():
    print(f'{v:4d}  {k[:60]}')
print()
print('==== 展开级 agent 列分布 ====')
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for k,v in collections.Counter(r.get('agent','') for r in exp).most_common():
    print(f'{v:4d}  {k[:80]}')
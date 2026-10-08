# -*- coding: utf-8 -*-
import csv, os
base = os.path.dirname(os.path.abspath(__file__))
des = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))
ids = [r['ID'] for r in des]
ev = set(os.listdir(os.path.join(base,'evidence')))
for t in ['D1-1','D2-4','D10-1','D1-65','D3-S1']:
    print(repr(t), 'in ids=', repr(t) in ids, 'in ev=', repr(t) in ev)
print('---- 设计级 ID 样例 ----')
for i in ids[:15]:
    print(repr(i))
print('---- 展开级 ID 样例 ----')
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for i in [r['ID'] for r in exp][:15]:
    print(repr(i))
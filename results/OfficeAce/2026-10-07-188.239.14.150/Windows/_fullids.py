# -*- coding: utf-8 -*-
import csv, os
base = os.path.dirname(os.path.abspath(__file__))
des = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))
print('=== 设计级全部 ID（按出现顺序）===')
print(' '.join(r['ID'] for r in des))
print()
print('=== 展开级全部 ID ===')
print(' '.join(r['ID'] for r in exp))
print()
# D10 相关
print('=== 设计级中 D10 开头 ===')
print([r['ID'] for r in des if r['ID'].startswith('D10')])
print('=== 展开级中 EXP-E 开头 ===')
print([r['ID'] for r in exp if r['ID'].startswith('EXP-E')])
print('=== 展开级中 EXP-D5 开头 ===')
print([(r['ID'], r.get('agent','')) for r in exp if r['ID'].startswith('EXP-D5')])
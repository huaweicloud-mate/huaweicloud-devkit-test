# -*- coding: utf-8 -*-
import csv, os, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

des = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))

print('===== 设计级全部 ID 与优先级 =====')
for r in des:
    print(r['ID'], r['优先级'], r.get('标题','')[:40])

print()
print('===== 展开级全部 ID 与优先级 =====')
for r in exp:
    print(r['ID'], r['优先级'], r.get('执行要点','')[:40] if r.get('执行要点') else r.get('枚举对象','')[:40])
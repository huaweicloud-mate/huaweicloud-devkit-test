# -*- coding: utf-8 -*-
import csv, os
base = os.path.dirname(os.path.abspath(__file__))
des = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig')))
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'), encoding='utf-8-sig')))
des_ids = [r['ID'] for r in des]
exp_ids = [r['ID'] for r in exp]
ev = set(os.listdir(os.path.join(base,'evidence')))
print('设计级ID数', len(des_ids))
print('展开级ID数', len(exp_ids))
print('evidence目录数', len(ev))
miss_des = sorted(set(des_ids) - ev)
miss_exp = sorted(set(exp_ids) - ev)
print('设计级缺evidence:', miss_des)
print('展开级缺evidence:', miss_exp)
all_ids = set(des_ids) | set(exp_ids)
extra = sorted(ev - all_ids)
print('grouped/多余目录:', extra)
print()
# 设计级优先级分布
import collections
c = collections.Counter(r['优先级'] for r in des)
print('设计级优先级分布:', dict(c))
c2 = collections.Counter(r['优先级'] for r in exp)
print('展开级优先级分布:', dict(c2))
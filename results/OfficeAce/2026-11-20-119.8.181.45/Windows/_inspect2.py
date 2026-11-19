# -*- coding: utf-8 -*-
import csv, io, os, collections
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, 'inspect2_out.txt'), 'w', encoding='utf-8')

def load(f):
    return list(csv.DictReader(io.open(os.path.join(base, f), encoding='utf-8-sig')))

d = load('用例矩阵-设计级.csv')
e = load('用例矩阵-展开级.csv')
m = load('使命-mission-001.csv')

out.write('design=%d expanded=%d mission=%d\n' % (len(d), len(e), len(m)))
out.write('design prio: %s\n' % collections.Counter(r['优先级'] for r in d))
out.write('design status: %s\n' % collections.Counter(r['执行状态'] for r in d))
out.write('design dims: %s\n' % collections.Counter(r['维度'] for r in d))
out.write('expanded prio: %s\n' % collections.Counter(r['优先级'] for r in e))
out.write('expanded status: %s\n' % collections.Counter(r['执行状态'] for r in e))
out.write('expanded types: %s\n' % collections.Counter(r['展开类型'] for r in e))
out.write('--- mission rows ---\n')
for r in m:
    out.write(str(r) + '\n')
out.write('--- design P0 ---\n')
for r in d:
    if r['优先级'] == 'P0':
        out.write('%s | %s | %s | %s | tools=%s\n' % (r['ID'], r['维度'], r['标题'], r['执行状态'], r.get('关联工具', '')))
out.write('--- expanded P0 ---\n')
for r in e:
    if r['优先级'] == 'P0':
        out.write('%s | %s | %s | %s\n' % (r['ID'], r['展开类型'], r['源用例'], r['执行状态']))
out.close()
print('ok')

# -*- coding: utf-8 -*-
import csv, io, os
base = os.path.dirname(os.path.abspath(__file__))
out = io.open(os.path.join(base, 'inspect3_out.txt'), 'w', encoding='utf-8')

def load(f):
    return list(csv.DictReader(io.open(os.path.join(base, f), encoding='utf-8-sig')))

d = load('用例矩阵-设计级.csv')
e = load('用例矩阵-展开级.csv')

out.write('--- design ALL ---\n')
for r in d:
    out.write('%s | %s | %s | %s | %s | %s\n' % (r['ID'], r['优先级'], r['维度'], r['标题'], r['执行状态'], r.get('关联工具', '')[:60]))

out.write('--- expanded ALL ---\n')
for r in e:
    out.write('%s | %s | %s | %s | %s | %s\n' % (r['ID'], r['优先级'], r['展开类型'], r['源用例'], r['执行要点'][:70], r['预期结果'][:70]))
out.close()
print('ok')

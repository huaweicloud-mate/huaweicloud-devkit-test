# -*- coding: utf-8 -*-
import csv, os, collections
base = os.path.dirname(os.path.abspath(__file__))
def read(p):
    with open(p, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))
des = read(os.path.join(base,'用例矩阵-设计级.csv'))
exp = read(os.path.join(base,'用例矩阵-展开级.csv'))

def stat(rows):
    c = collections.Counter((r['执行状态'] or '').strip() for r in rows)
    return c

print('=== 设计级 状态分布 ===')
for k,v in stat(des).most_common():
    print(f'{v:4d}  [{k}]')
print('设计级总数', len(des))
print()
print('=== 展开级 状态分布 ===')
for k,v in stat(exp).most_common():
    print(f'{v:4d}  [{k}]')
print('展开级总数', len(exp))
print()
# 空的执行状态
print('=== 设计级 空状态列 ===')
for r in des:
    if not (r['执行状态'] or '').strip():
        print(r['ID'], r['优先级'], r['标题'][:40], '| evidence=', (r['evidencePath'] or '').strip(), '| blockedReason=', (r.get('blockedReason') or '').strip())
print()
print('=== 展开级 空状态列 ===')
for r in exp:
    if not (r['执行状态'] or '').strip():
        print(r['ID'], r['优先级'], '| evidence=', (r['evidencePath'] or '').strip(), '| blockedReason=', (r.get('blockedReason') or '').strip())
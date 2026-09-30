import csv, io, os
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
design = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
expanded = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
print('DESIGN total', len(design))
print(Counter(r['执行状态'] for r in design))
print()
print('EXPANDED total', len(expanded))
print(Counter(r['执行状态'] for r in expanded))
print()
# priority split for design
print('DESIGN by priority:')
for p in ['P0','P1','P2','P3']:
    sub=[r for r in design if r['优先级']==p]
    print(' ', p, len(sub), Counter(r['执行状态'] for r in sub))
print()
print('EXPANDED by priority:')
for p in ['P0','P1','P2','P3']:
    sub=[r for r in expanded if r['优先级']==p]
    print(' ', p, len(sub), Counter(r['执行状态'] for r in sub))
print()
# blocked reason
for r in design:
    if r['执行状态']=='BLOCKED':
        print('BLOCKED design:', r['ID'], r['优先级'], '|', r['blockedReason'][:120])
print()
for r in expanded:
    if r['执行状态']=='FAIL':
        print('FAIL expanded:', r['ID'], r['优先级'], '|', r['blockedReason'][:120])
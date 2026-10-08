# -*- coding: utf-8 -*-
import csv, os, json
base = os.path.dirname(os.path.abspath(__file__))
ev = os.path.join(base, 'evidence')

def read(p):
    with open(p, encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))
des = read(os.path.join(base,'用例矩阵-设计级.csv'))
exp = read(os.path.join(base,'用例矩阵-展开级.csv'))

allids = [(r['ID'], 'des', r['优先级']) for r in des] + [(r['ID'], 'exp', r['优先级']) for r in exp]

have = set()
have_nonempty = set()
for d in os.listdir(ev):
    p = os.path.join(ev, d)
    if not os.path.isdir(p):
        continue
    sl = os.path.join(p, 'stdout.log')
    if os.path.isfile(sl):
        have.add(d)
        if os.path.getsize(sl) > 0:
            have_nonempty.add(d)

missing = []
for cid, lvl, pri in allids:
    if cid not in have:
        missing.append((cid, lvl, pri, '无stdout.log'))
    elif cid not in have_nonempty:
        missing.append((cid, lvl, pri, 'stdout.log为空'))

print(f'CSV 用例总数 = {len(allids)}')
print(f'有 stdout.log 的 case 目录 = {len(have)}')
print(f'其中非空 = {len(have_nonempty)}')
print()
print(f'=== 需要补证据的用例（{len(missing)} 条）===')
for cid, lvl, pri, why in missing:
    print(f'{cid}\t{pri}\t{lvl}\t{why}')

# 有没有 evidence 目录存在但 CSV 里没有的
csvids = set(x[0] for x in allids)
extra = [d for d in have if d not in csvids]
print()
print(f'=== evidence 有但 CSV 无此 ID 的目录（{len(extra)}）===')
print(extra)
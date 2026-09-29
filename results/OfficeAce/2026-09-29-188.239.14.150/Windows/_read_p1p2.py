# AI生成
import csv, json, os

base = os.path.dirname(os.path.abspath(__file__))
f = open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')
r = csv.DictReader(f)
rows = list(r)
f.close()

p1 = [x for x in rows if x.get('优先级') == 'P1']
p2 = [x for x in rows if x.get('优先级') == 'P2']

out = []
out.append(f'P1: {len(p1)} cases, P2: {len(p2)} cases')
out.append('')

out.append('=== P1 Design Level ===')
for c in p1:
    out.append(f"{c['ID']}|{c['标题'][:60]}|{c.get('终端覆盖类型','')}|{c.get('关联工具','')[:40]}")

out.append('')
out.append('=== P2 Design Level ===')
for c in p2:
    out.append(f"{c['ID']}|{c['标题'][:60]}|{c.get('终端覆盖类型','')}|{c.get('关联工具','')[:40]}")

# Also read expanded level
f2 = open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')
r2 = csv.DictReader(f2)
exp = list(r2)
f2.close()

out.append('')
out.append(f'=== Expanded Level ({len(exp)} cases) ===')
for c in exp:
    out.append(f"{c.get('ID','')}|{c.get('标题','')[:60]}|{c.get('优先级','')}|{c.get('关联工具','')[:40]}")

with open(os.path.join(base, '_p1p2_list.txt'), 'w', encoding='utf-8') as w:
    w.write('\n'.join(out))
print(f'P1: {len(p1)}, P2: {len(p2)}, Expanded: {len(exp)}')
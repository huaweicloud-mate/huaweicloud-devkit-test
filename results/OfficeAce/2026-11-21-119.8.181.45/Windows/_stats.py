import csv, os
base = os.path.dirname(os.path.abspath(__file__))
rows = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
from collections import Counter
print("设计级:", len(rows), dict(Counter(r['优先级'] for r in rows)))
p0 = [r for r in rows if r['优先级']=='P0']
for r in p0:
    print("P0:", r['ID'], r['标题'], "| tool:", r['关联工具'][:40], "| agent:", r['agent'][:40])
rows2 = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
print("展开级:", len(rows2), dict(Counter(r['优先级'] for r in rows2)))
srcs = Counter(r['源用例'] for r in rows2)
print("展开级源分布:", dict(srcs))
for r in rows2[:3]:
    print("EXP sample:", r['ID'], "|", r['执行要点'][:100])

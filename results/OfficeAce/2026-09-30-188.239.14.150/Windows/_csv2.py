import csv, io, os
HERE = os.path.dirname(os.path.abspath(__file__))
expanded = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
print('expanded count:', len(expanded))
for r in expanded:
    print(r['ID'], '|', r.get('优先级'), '|', r.get('agent'), '|', r.get('OS'))
print()
# design agent/OS distribution
design = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
from collections import Counter
print('design agent counts:', Counter(r['agent'] for r in design))
print('design OS counts:', Counter(r['OS'] for r in design))
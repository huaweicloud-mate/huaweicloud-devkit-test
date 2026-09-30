import csv, io, os
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
design = list(csv.DictReader(io.open(os.path.join(HERE, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
print('design agent counts:', Counter(r['agent'] for r in design))
print('design OS counts:', Counter(r['OS'] for r in design))
print()
# which design IDs have agent != OfficeAce or containing OfficeAce
mine = [r for r in design if 'OfficeAce' in r['agent']]
print('design cases matching OfficeAce:', len(mine))
for r in mine:
    print(r['ID'], '|', r['优先级'], '|', r['agent'], '|', r['OS'])
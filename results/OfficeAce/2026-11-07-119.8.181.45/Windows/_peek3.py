import csv
r = list(csv.DictReader(open('使命-mission-001.csv', encoding='utf-8-sig')))
print('MISSION cases', len(r))
for row in r:
    print(row.get('ID'), '|', row.get('优先级'), '|', row.get('标题','')[:70], '|', row.get('OS',''), row.get('agent',''))
print('='*80)
d = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
from collections import Counter
c = Counter(x.get('优先级','') for x in d)
print('DESIGN total', len(d), 'by priority', dict(c))
for x in d:
    if x.get('优先级') in ('P0','P1'):
        print(x.get('ID'), '|', x.get('优先级'), '|', x.get('标题','')[:60])
import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-27-119.8.181.45\Windows'
rows = list(csv.DictReader(open(base + r'\用例矩阵-设计级.csv', encoding='utf-8-sig')))
from collections import Counter
c = Counter(r.get('优先级','') for r in rows)
print('设计级', len(rows), dict(c))
rows2 = list(csv.DictReader(open(base + r'\用例矩阵-展开级.csv', encoding='utf-8-sig')))
c2 = Counter(r.get('优先级','') for r in rows2)
print('展开级', len(rows2), dict(c2))
print('展开级 IDs:', ','.join(r['ID'] for r in rows2))
m = list(csv.DictReader(open(base + r'\使命-mission-001.csv', encoding='utf-8-sig')))
print('mission-001', len(m), ','.join(r.get('ID', r.get('用例ID','')) for r in m))

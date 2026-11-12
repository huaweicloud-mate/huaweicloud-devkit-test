# -*- coding: utf-8 -*-
import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows'
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.DictReader(open(base + '\\' + f, encoding='utf-8-sig')))
    print(f, len(rows))
    print('cols:', list(rows[0].keys()))
    from collections import Counter
    print(Counter(r['优先级'] for r in rows))
    if '使命' in f or 'mission' in f: pass
rows = list(csv.DictReader(open(base + '\\使命-mission-001.csv', encoding='utf-8-sig')))
print('mission cases:', [r.get('ID') or r.get('用例ID') for r in rows])

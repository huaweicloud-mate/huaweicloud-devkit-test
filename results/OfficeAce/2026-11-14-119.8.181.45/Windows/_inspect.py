# -*- coding: utf-8 -*-
import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-14-119.8.181.45\Windows'
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv', '需求-设计-证据追踪表.csv', '使命-mission-001.csv']:
    rows = list(csv.DictReader(open(base + '\\' + f, encoding='utf-8-sig')))
    print('FILE:', f, 'rows:', len(rows))
    if rows:
        print('  cols:', ' | '.join(list(rows[0].keys())))

# -*- coding: utf-8 -*-
import csv, io, sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
rows = list(csv.DictReader(io.open(base + '\\用例矩阵-展开级.csv', encoding='utf-8-sig')))
print('TOTAL', len(rows))
print('COLS', list(rows[0].keys()))
print('PRIORITY', dict(Counter(r['优先级'] for r in rows)))
print('AGENT', dict(Counter(r['agent'] for r in rows)))
print('OS', dict(Counter(r['OS'] for r in rows)))
print('EXPANDTYPE', dict(Counter(r['展开类型'] for r in rows)))
for r in rows:
    print(r['ID'], '|', r['优先级'], '|', r['展开类型'], '|', r['源用例'], '|', (r['terminal'] if 'terminal' in r else r.get('terminalType','')), '|', r.get('OS',''))
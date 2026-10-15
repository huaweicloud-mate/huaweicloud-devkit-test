# -*- coding: utf-8 -*-
import csv, io, sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
for name in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.DictReader(io.open(base + '\\' + name, encoding='utf-8-sig')))
    print('==== ' + name + ' total=' + str(len(rows)))
    print('cols=', list(rows[0].keys()))
    print('priority=', dict(Counter(r['优先级'] for r in rows)))
    print('agent=', dict(Counter(r['agent'] for r in rows)))
    print('OS=', dict(Counter(r['OS'] for r in rows)))
    if '终端覆盖类型' in rows[0]:
        print('覆盖=', dict(Counter(r['终端覆盖类型'] for r in rows)))
    print('IDs=', [r['ID'] for r in rows])
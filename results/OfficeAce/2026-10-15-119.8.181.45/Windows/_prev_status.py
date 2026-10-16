# -*- coding: utf-8 -*-
import io, sys, csv
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-15-119.8.181.45\Windows'
for fn in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv','使命-mission-001.csv']:
    rows = list(csv.DictReader(io.open(base + '\\' + fn, encoding='utf-8-sig')))
    print('===', fn)
    print(' status:', dict(Counter(r.get('执行状态') for r in rows)))
    eps = [(r.get('ID'), r.get('执行状态'), r.get('evidencePath')) for r in rows if r.get('evidencePath')]
    print(' with evidencePath count=', len(eps))
    for e in eps[:60]:
        print('  ', e)
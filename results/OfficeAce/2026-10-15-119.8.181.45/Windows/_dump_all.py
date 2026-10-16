# -*- coding: utf-8 -*-
import csv, io, os, sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-15-119.8.181.45\Windows'

def dump(name):
    rows = list(csv.DictReader(io.open(os.path.join(base, name), encoding='utf-8-sig')))
    print('==== ' + name + ' total=' + str(len(rows)))
    st = Counter(r['执行状态'] for r in rows)
    print('status=', dict(st))
    for r in rows:
        if r['优先级'] in ('P0','P1'):
            print(r['优先级'], r['ID'], '|', r['执行状态'], '|', (r.get('evidencePath') or '')[:50], '|', (r.get('blockedReason') or '')[:60])

dump('用例矩阵-设计级.csv')
dump('用例矩阵-展开级.csv')
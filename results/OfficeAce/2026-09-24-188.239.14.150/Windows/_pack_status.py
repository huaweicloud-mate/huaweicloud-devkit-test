import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
from collections import Counter
import os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-24-188.239.14.150\Windows'
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.DictReader(open(os.path.join(base, f), encoding='utf-8-sig')))
    st = Counter((r.get('执行状态') or '').strip() for r in rows)
    print(f, 'total=', len(rows), '| status=', dict(st))
    print('  fields:', rows[0].keys() if rows else [])
    # show P0 rows status
    p0 = [r for r in rows if r.get('优先级') == 'P0']
    print('  P0 rows:', [(r['ID'], (r.get('执行状态') or '').strip()) for r in p0])
print()
import glob
print('dirs in pack:', sorted(os.listdir(base)))
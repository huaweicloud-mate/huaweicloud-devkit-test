# -*- coding: utf-8 -*-
import csv, io, sys, os
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'

def load(name):
    p = os.path.join(base, name)
    if not os.path.isfile(p):
        return None
    return list(csv.DictReader(io.open(p, encoding='utf-8-sig')))

for f in os.listdir(base):
    if f.endswith('.csv'):
        rows = load(f)
        st = Counter((r.get('执行状态') or '') for r in rows)
        print('###', repr(f), 'total=', len(rows), 'status=', dict(st))
        # P0 status
        p0 = [r for r in rows if r.get('优先级') == 'P0']
        print('  P0:', [(r['ID'], r.get('执行状态'), (r.get('evidencePath') or '')[:20]) for r in p0])

print('=== evidence dirs ===')
ev = os.path.join(base, 'evidence')
if os.path.isdir(ev):
    for d in sorted(os.listdir(ev)):
        p = os.path.join(ev, d)
        if os.path.isdir(p):
            has_stdout = os.path.isfile(os.path.join(p, 'stdout.log'))
            sq = os.path.getsize(os.path.join(p, 'stdout.log')) if has_stdout else 0
            print(d, 'stdout.log=', has_stdout, 'size=', sq)
print('=== report/findings ===')
for name in ['测试报告.md', 'FINDINGS.md', 'daily-test-report.md']:
    p = os.path.join(base, name)
    print(name, 'exists=', os.path.isfile(p))
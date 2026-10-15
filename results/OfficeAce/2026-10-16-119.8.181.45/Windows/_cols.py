# -*- coding: utf-8 -*-
import csv, io, sys, os
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
for f in os.listdir(base):
    if f.endswith('.csv'):
        rows = list(csv.DictReader(io.open(os.path.join(base, f), encoding='utf-8-sig')))
        print('###', repr(f), 'rows=', len(rows))
        if rows:
            print('cols=', list(rows[0].keys()))
            print('keys=', sorted({k for r in rows for k in r.keys()}))
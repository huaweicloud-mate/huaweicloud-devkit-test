# -*- coding: utf-8 -*-
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce'
for day in ['2026-11-04-119.8.181.45', '2026-11-05-119.8.181.45', '2026-11-06-119.8.181.45', '2026-11-07-119.8.181.45']:
    wd = os.path.join(base, day, 'Windows')
    print('====', day, '====')
    for f in os.listdir(wd):
        fp = os.path.join(wd, f)
        if os.path.isfile(fp):
            print('  file:', f, os.path.getsize(fp))
    evd = os.path.join(wd, 'evidence')
    if os.path.isdir(evd):
        eids = os.listdir(evd)
        print('  evidence dirs:', len(eids), eids[:15])
    # count status in design csv
    import io, csv
    for fn in os.listdir(wd):
        if fn.endswith('.csv') and '设计级' in fn:
            with io.open(os.path.join(wd, fn), encoding='utf-8-sig') as fh:
                rows = list(csv.DictReader(fh))
            from collections import Counter
            c = Counter(r.get('执行状态','') for r in rows)
            print('  design status:', dict(c))
        if fn.endswith('.csv') and '展开级' in fn:
            with io.open(os.path.join(wd, fn), encoding='utf-8-sig') as fh:
                rows = list(csv.DictReader(fh))
            from collections import Counter
            c = Counter(r.get('执行状态','') for r in rows)
            print('  expanded status:', dict(c))

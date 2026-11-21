import csv, os
from collections import Counter
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce"
for day in ['2026-11-16-119.8.181.45','2026-11-15-119.8.181.45','2026-11-14-119.8.181.45']:
    p = os.path.join(base, day, 'Windows')
    if not os.path.isdir(p):
        print(day, 'no dir'); continue
    for f in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
        fp = os.path.join(p, f)
        if not os.path.exists(fp):
            print(day, f, 'missing'); continue
        rows = list(csv.DictReader(open(fp, encoding='utf-8-sig')))
        st = Counter(r.get('执行状态','') for r in rows)
        print(day, f, len(rows), dict(st))
        ev = [(r['ID'], r.get('evidencePath','')) for r in rows if r.get('evidencePath','')]
        print('  with evidence:', len(ev), ev[:6])
        issues = [(r['ID'], r.get('执行状态',''), (r.get('blockedReason','') or '')[:70]) for r in rows if r.get('执行状态','') in ('FAIL','SPEC-MISMATCH','BLOCKED')]
        for i in issues[:12]: print('   issue:', i)

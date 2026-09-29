import csv, os
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-29-188.239.14.150\Windows'
targets = ['D2-4','D4-16','D4-27','D8-4','D9-2','D9-9','D4-2','D4-28','D9-12']
rows = list(csv.DictReader(open(os.path.join(base,'用例矩阵-设计级.csv'),encoding='utf-8-sig')))
byid = {r['ID']: r for r in rows}
exp = list(csv.DictReader(open(os.path.join(base,'用例矩阵-展开级.csv'),encoding='utf-8-sig')))
byid2 = {r['ID']: r for r in exp}
print('字段名(设计级):', list(rows[0].keys()))
print()
for t in targets:
    r = byid.get(t)
    if not r: continue
    print('==== %s [%s/%s] ====' % (t, r.get('优先级'), r.get('执行状态')))
    for k,v in r.items():
        if v and v.strip():
            print('  %s: %s' % (k, v))
    print()
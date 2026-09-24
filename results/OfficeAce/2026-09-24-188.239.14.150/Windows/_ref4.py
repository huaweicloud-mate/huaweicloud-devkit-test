import csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')
base_ref = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-09-22-188.239.14.150\Windows'
rows = list(csv.DictReader(open(os.path.join(base_ref, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
for r in rows:
    if r['ID'] in ('D9-12', 'D9-13', 'D10-4', 'D4-23', 'D4-3'):
        print(r['ID'], '|', r['优先级'], '|', r['执行状态'], '|', r['evidencePath'], '|', r['标题'][:30])
print('--- D4-3 evidence ---')
p = os.path.join(base_ref, 'evidence', 'D4-3')
if os.path.isdir(p):
    for f in os.listdir(p):
        print(' ', f)
        fp = os.path.join(p, f)
        if f.endswith('.log'):
            print(open(fp, encoding='utf-8-sig').read()[:500])
else:
    print('NO DIR')
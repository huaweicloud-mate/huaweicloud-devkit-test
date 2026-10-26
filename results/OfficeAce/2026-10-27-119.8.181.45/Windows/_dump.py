import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-27-119.8.181.45\Windows'

for name in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    with open(base + '\\' + name, encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    print('==== ' + name + ' n=' + str(len(rows)))
    prio = {}
    for row in rows:
        p = (row.get('优先级') or '').strip()
        prio[p] = prio.get(p, 0) + 1
    print('prio:', prio)
import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-27-119.8.181.45\Windows'
rows = list(csv.DictReader(open(base + r'\用例矩阵-设计级.csv', encoding='utf-8-sig')))
print(','.join(rows[0].keys()))
for r in rows[:3]:
    print('---')
    for k, v in r.items():
        print(k, '=', (v or '')[:60])

import csv, sys
from collections import Counter
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-22-119.8.181.45\Windows"
for f in ['用例矩阵-设计级.csv','用例矩阵-展开级.csv']:
    rows = list(csv.DictReader(open(base + '\\' + f, encoding='utf-8-sig')))
    print('===', f, len(rows))
    print('P:', Counter(r.get('优先级','') for r in rows))
    if '维度' in rows[0]:
        print('D:', Counter(r.get('维度','') for r in rows))
    print('cols:', list(rows[0].keys()))

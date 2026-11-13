# -*- coding: utf-8 -*-
import re, csv, sys
sys.stdout.reconfigure(encoding='utf-8')
root = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test"
t = open(root + r"\scripts\_batch_runner_officeace_20261112.mjs", encoding='utf-8').read()
ids = sorted(set(re.findall(r"writeResult\('([^']+)'", t)))
open(root + r"\results\OfficeAce\2026-11-14-119.8.181.45\Windows\_runner_ids.txt", 'w').write('\n'.join(ids))
print('runner ids', len(ids))
base = root + r"\results\OfficeAce\2026-11-14-119.8.181.45\Windows\\"
today = []
for f in ['用例矩阵-设计级.csv', '用例矩阵-展开级.csv']:
    rows = list(csv.reader(open(base + f, encoding='utf-8-sig')))
    for r in rows[1:]:
        today.append(r[0])
open(base + '_today_ids.txt', 'w').write('\n'.join(today))
print('today ids', len(today))
miss = [i for i in today if i not in ids]
extra = [i for i in ids if i not in today]
print('missing in runner:', miss)
print('extra in runner:', extra)

# -*- coding: utf-8 -*-
import csv, io
from collections import Counter
d = list(csv.DictReader(io.open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
print("cols:", list(d[0].keys()))
missing = ['D1-65','D1-66','D1-67','D1-68','D1-69','D1-70','D2-27','D3-C13','D3-C14',
           'D3-S1','D3-S2','D3-S3','D3-S4','D3-S5','D3-S6','D3-S7','D3-S8',
           'D4-25','D4-26','D4-29','D6-9','D8-9','D8-10','D9-10','D9-11','D9-12','D9-13']
c = Counter()
for x in d:
    if x['ID'] in missing:
        c[(x.get('终端覆盖类型') or '').strip()] += 1
print("终端覆盖类型 distribution among 27 missing:")
for k, v in c.most_common():
    print(v, '|', k)
print()
# 打印每个缺失用例的 terminal / agent / 终端覆盖类型
for x in d:
    if x['ID'] in missing:
        print(x['ID'], '| 覆盖:', (x.get('终端覆盖类型') or '').strip(), '| agent:', (x.get('agent') or '').strip()[:40], '| term:', (x.get('terminal') or '').strip()[:45])
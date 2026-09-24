# -*- coding: utf-8 -*-
import csv, io
from collections import Counter
r = list(csv.DictReader(io.open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
for col in ['终端覆盖类型', 'terminal', 'design_status']:
    c = Counter((x.get(col) or '')[:60] for x in r)
    print('=====', col, '=====')
    for k, v in c.most_common():
        print(v, '|', k)
    print()
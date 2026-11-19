# -*- coding: utf-8 -*-
import csv, sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
hdr = rows[0]
print(hdr)
print('设计级用例数:', len(rows) - 1)
for r in rows[1:]:
    print(r[0], '|', r[1], '|', r[2], '|', r[3], '|', r[4] if len(r) > 4 else '')

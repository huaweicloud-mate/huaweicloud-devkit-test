# -*- coding: utf-8 -*-
import csv, os
base = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(base,'用例矩阵-设计级.csv'), encoding='utf-8-sig', newline='') as f:
    rows = list(csv.DictReader(f))
for r in rows:
    if r['ID'] in ('D5-1','D5-3'):
        print('=====', r['ID'], '=====')
        for k,v in r.items():
            if v and v.strip():
                print(f'  {k}: {v}')
        print()
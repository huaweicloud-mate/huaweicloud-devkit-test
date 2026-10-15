# -*- coding: utf-8 -*-
import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
rows = list(csv.DictReader(io.open(base + '\\用例矩阵-设计级.csv', encoding='utf-8-sig')))
for r in rows:
    if r['优先级'] == 'P0':
        print(r['ID'], '|', r['维度'], '|', r['标题'], '| 工具=', r['关联工具'], '| 覆盖=', r['终端覆盖类型'])
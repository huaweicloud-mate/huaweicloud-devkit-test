# -*- coding: utf-8 -*-
import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
p = base + '\\用例矩阵-设计级.csv'
rows = list(csv.DictReader(io.open(p, encoding='utf-8-sig')))
for r in rows:
    print('%s\t%s\t%s\t%s' % (r['ID'], r['优先级'], r['维度'], r['标题']))
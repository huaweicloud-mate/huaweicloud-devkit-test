# -*- coding: utf-8 -*-
import csv, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.reader(open('使命-mission-001.csv', encoding='utf-8-sig')))
hdr = rows[0]
iId, iPri, iTitle = hdr.index('ID'), hdr.index('优先级'), hdr.index('标题')
for r in rows[1:]:
    print(r[iId], '|', r[iPri], '|', r[iTitle])

# -*- coding: utf-8 -*-
import csv, io
from collections import Counter
r = list(csv.DictReader(io.open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
ac = Counter((x.get('agent') or '').split(';')[0].strip() for x in r)
out = []
for k, v in ac.most_common():
    out.append(f"{v} | {k[:80]}")
print("\n".join(out))
print("--- OfficeAce presence ---")
cnt = sum(1 for x in r if 'OfficeAce' in (x.get('agent') or ''))
print("rows with OfficeAce in agent:", cnt, "/", len(r))
# -*- coding: utf-8 -*-
import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-14-119.8.181.45\Windows'
rows = list(csv.DictReader(open(base + '\\用例矩阵-设计级.csv', encoding='utf-8-sig')))
print('===== 设计级 P0 全 21 条 =====')
for r in rows:
    if r['优先级'] == 'P0':
        print('-', r['ID'], '|', r['标题'][:60])
print()
print('===== 展开级 39 条（agent/OS/优先级） =====')
rows = list(csv.DictReader(open(base + '\\用例矩阵-展开级.csv', encoding='utf-8-sig')))
from collections import Counter
print(Counter(r['优先级'] for r in rows))
for r in rows:
    print('-', r['ID'], '| P:', r['优先级'], '| agent:', r.get('agent',''), '| OS:', r.get('OS',''), '|', (r.get('执行要点') or '')[:50])

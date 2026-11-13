# -*- coding: utf-8 -*-
import csv, io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-14-119.8.181.45\Windows'

print('===== 使命 mission-001 (P0) =====')
rows = list(csv.DictReader(open(base + '\\使命-mission-001.csv', encoding='utf-8-sig')))
for r in rows:
    print('- ID:', r['ID'], '| P:', r.get('优先级'), '| 标题:', r.get('标题', '')[:60])
    print('  步骤:', (r.get('操作步骤') or '')[:120])
    print('  预期:', (r.get('预期结果') or '')[:120])

print()
print('===== 设计级 P0 分布 =====')
rows = list(csv.DictReader(open(base + '\\用例矩阵-设计级.csv', encoding='utf-8-sig')))
from collections import Counter
print(Counter(r['优先级'] for r in rows))
print(Counter(r['维度'] for r in rows))
print()
print('===== 设计级 P0 清单 =====')
for r in rows:
    if r['优先级'] == 'P0':
        print('-', r['ID'], '|', r['维度'], '|', r['标题'][:70], '| agent:', r.get('agent',''), '| OS:', r.get('OS',''), '| 终端:', r.get('terminal',''))

# -*- coding: utf-8 -*-
"""检查执行包 CSV 回填状态 + 列出用例清单"""
import csv, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
BASE = os.path.join(REPO, 'results', 'OfficeAce', '2026-11-19-119.8.181.45', 'Windows')

def load(f):
    p = os.path.join(BASE, f)
    with open(p, encoding='utf-8-sig') as fh:
        return list(csv.DictReader(fh))

design = load('用例矩阵-设计级.csv')
expanded = load('用例矩阵-展开级.csv')
mission = load('使命-mission-001.csv')

from collections import Counter
for name, rows in [('设计级', design), ('展开级', expanded), ('mission-001', mission)]:
    c = Counter((r.get('执行状态') or '').strip() or '(空)' for r in rows)
    print(f'== {name} N={len(rows)} status={dict(c)}')

print()
print('=== 设计级列名 ===')
print(list(design[0].keys()))
print()
print('=== 设计级用例简表 (ID/优先级/维度/执行状态) ===')
for r in design:
    rid = r.get('ID') or r.get('用例ID') or ''
    pri = r.get('优先级') or ''
    dim = (r.get('维度') or r.get('测试维度') or '')[:10]
    st = (r.get('执行状态') or '').strip() or '-'
    title = (r.get('用例名称') or r.get('标题') or r.get('用例标题') or '')[:40]
    print(f'{rid}\t{pri}\t{dim}\t{st}\t{title}')
print()
print('=== 展开级用例简表 ===')
for r in expanded:
    rid = r.get('ID') or r.get('用例ID') or ''
    pri = r.get('优先级') or ''
    st = (r.get('执行状态') or '').strip() or '-'
    title = (r.get('用例名称') or r.get('标题') or r.get('用例标题') or '')[:40]
    print(f'{rid}\t{pri}\t{st}\t{title}')
print()
print('=== mission-001 ===')
print(list(mission[0].keys()))
for r in mission:
    print({k: (v[:60] if v else v) for k, v in r.items() if k in ('id','priority','cases','title','affectedCases','name','描述')})

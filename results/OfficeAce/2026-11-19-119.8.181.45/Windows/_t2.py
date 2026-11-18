# -*- coding: utf-8 -*-
import csv, sys, os
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print('===== 展开级（39条，归本客户端执行）=====')
rows = list(csv.DictReader(open('用例矩阵-展开级.csv', encoding='utf-8-sig')))
for r in rows:
    print(f"{r['ID']} | {r['优先级']} | {r['展开类型']} | src={r['源用例']} | agent={r['agent']} | OS={r['OS']} | ev={r['requiredEvidence'][:20]} | {r['执行要点'][:60]}")

print()
print('===== mission-001 P0（9条）=====')
rows = list(csv.DictReader(open('使命-mission-001.csv', encoding='utf-8-sig')))
for r in rows:
    print(f"{r['ID']} | {r['优先级']} | {r['标题'][:50]} | step={r['操作步骤'][:60]}")

print()
print('===== 设计级按优先级统计 =====')
rows = list(csv.DictReader(open('用例矩阵-设计级.csv', encoding='utf-8-sig')))
from collections import Counter
print(Counter(r['优先级'] for r in rows))
for r in rows:
    print(f"{r['ID']} | {r['优先级']} | {r['维度'][:12]} | {r['标题'][:56]} | agent={r['agent'][:20]} | OS={r['OS'][:12]} | ev={r['requiredEvidence'][:24]}")

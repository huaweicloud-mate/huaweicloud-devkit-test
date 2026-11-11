# -*- coding: utf-8 -*-
import sys, json, csv
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows'
rows = list(csv.DictReader(open(base + r'\用例矩阵-设计级.csv', encoding='utf-8-sig')))
d8 = [r for r in rows if r['ID'].startswith('D8')]
for r in d8:
    print(r['ID'], '|', r['标题'][:60], '|', r['优先级'], '|', r['关联工具'][:40])
print()
d = json.load(open(base + r'\evidence\_batch_summary.json', encoding='utf-8'))
for r in d['results']:
    if r['caseId'].startswith('D8'):
        print(r['caseId'], r['status'], r['why'][:100])

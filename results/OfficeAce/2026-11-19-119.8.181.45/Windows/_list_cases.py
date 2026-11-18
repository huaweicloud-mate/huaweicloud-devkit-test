# -*- coding: utf-8 -*-
"""列出全部用例 + 扫描仓库现成探针资产"""
import csv, os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

REPO = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test'
BASE = os.path.join(REPO, 'results', 'OfficeAce', '2026-11-19-119.8.181.45', 'Windows')

def load(f):
    with open(os.path.join(BASE, f), encoding='utf-8-sig') as fh:
        return list(csv.DictReader(fh))

design = load('用例矩阵-设计级.csv')
expanded = load('用例矩阵-展开级.csv')

out = []
out.append('=== 设计级全量 ===')
for r in design:
    out.append('|'.join([r.get('ID',''), r.get('优先级',''), r.get('维度',''), (r.get('标题') or '')[:50], (r.get('关联工具') or '')[:30]]))
out.append('')
out.append('=== 展开级全量 ===')
ecols = list(expanded[0].keys())
out.append('cols: ' + ','.join(ecols))
for r in expanded:
    out.append('|'.join([r.get('ID',''), r.get('优先级',''), (r.get('标题') or r.get('用例名称') or '')[:50], (r.get('关联工具') or '')[:30]]))

with open(os.path.join(BASE, '_cases_full.txt'), 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(out))

# 扫描探针资产
out2 = []
for root, dirs, files in os.walk(REPO):
    dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', 'hdk', '__pycache__')]
    for f in files:
        if f.endswith(('.mjs', '.js')) and ('probe' in f.lower() or 'evidence' in root.lower()):
            out2.append(os.path.relpath(os.path.join(root, f), REPO))
with open(os.path.join(BASE, '_probe_assets.txt'), 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(sorted(out2)))
print('written', len(out), 'cases lines;', len(out2), 'probe assets')

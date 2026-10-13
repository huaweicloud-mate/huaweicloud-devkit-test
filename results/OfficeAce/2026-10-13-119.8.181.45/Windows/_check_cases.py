# AI生成
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import csv, json, os

BASE = os.path.dirname(os.path.abspath(__file__))

# Read design CSV
with open(os.path.join(BASE, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    design = list(csv.DictReader(f))

# Read expanded CSV
with open(os.path.join(BASE, '用例矩阵-展开级.csv'), encoding='utf-8-sig') as f:
    expanded = list(csv.DictReader(f))

# New cases
new_ids = ['D3-C1', 'D3-C2', 'D3-C3', 'D3-C6', 'D3-C7']
print("=== New cases detail ===")
for r in design:
    if r['ID'] in new_ids:
        print(f"\n{r['ID']} (P{r.get('优先级','')}) | {r.get('维度','')}")
        print(f"  Title: {r.get('标题','')}")
        print(f"  Steps: {r.get('操作步骤','')[:200]}")
        print(f"  Expected: {r.get('预期结果','')[:200]}")
        print(f"  Tools: {r.get('关联工具','')[:100]}")
        print(f"  Auto: {r.get('自动化建议','')[:100]}")

# Check D9-4, D9-5
print("\n=== D9-4, D9-5 detail ===")
for r in design:
    if r['ID'] in ('D9-4', 'D9-5'):
        print(f"\n{r['ID']} (P{r.get('优先级','')}) | {r.get('维度','')}")
        print(f"  Title: {r.get('标题','')}")
        print(f"  Steps: {r.get('操作步骤','')[:200]}")
        print(f"  Expected: {r.get('预期结果','')[:200]}")

# Check evidence for D9-4, D9-5
for cid in ['D9-4', 'D9-5']:
    evid = os.path.join(BASE, 'evidence', cid)
    if os.path.exists(evid):
        stdout = os.path.join(evid, 'stdout.log')
        if os.path.exists(stdout):
            with open(stdout, 'r', encoding='utf-8', errors='replace') as f:
                text = f.read()
            print(f"\n{cid} stdout.log (last 500 chars):")
            print(text[-500:])

# Check grouped probe results for d4-security to see D4-16 status
print("\n=== d4-security grouped probe (D4-16 check) ===")
evid = os.path.join(BASE, 'evidence', 'd4-security', 'stdout.log')
if os.path.exists(evid):
    with open(evid, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    # Find D4-16 in the results
    import re
    m = re.search(r'"id"\s*:\s*"D4-16".*?"status"\s*:\s*"(\w+)"', text)
    if m:
        print(f"D4-16 status in grouped: {m.group(1)}")
    else:
        # Try to find it differently
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if 'D4-16' in line:
                start = max(0, i-2)
                end = min(len(lines), i+5)
                print(f"D4-16 context:")
                for l in lines[start:end]:
                    print(f"  {l}")
                break

# Check D2-4 in d2-auth grouped
print("\n=== d2-auth grouped probe (D2-4 check) ===")
evid = os.path.join(BASE, 'evidence', 'd2-auth', 'stdout.log')
if os.path.exists(evid):
    with open(evid, 'r', encoding='utf-8', errors='replace') as f:
        text = f.read()
    lines = text.split('\n')
    for i, line in enumerate(lines):
        if 'D2-4' in line:
            start = max(0, i-2)
            end = min(len(lines), i+5)
            print(f"D2-4 context:")
            for l in lines[start:end]:
                print(f"  {l}")
            break

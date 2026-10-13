# AI生成
import csv, json, os

base = os.path.dirname(os.path.abspath(__file__))

# Design level
with open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    design_rows = list(csv.DictReader(f))

# Expanded level
with open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig') as f:
    expanded_rows = list(csv.DictReader(f))

# Print headers
print("=== Design headers ===")
print(list(design_rows[0].keys()))
print()
print("=== Expanded headers ===")
print(list(expanded_rows[0].keys()))
print()

# P0 cases
print("=== P0 Design cases (21) ===")
for r in design_rows:
    if r.get('优先级','') == 'P0':
        print(f"{r['ID']} | {r.get('维度','')} | {r.get('用例标题','')[:80]}")
print()

# P1 cases (design)
print("=== P1 Design cases (56) ===")
for r in design_rows:
    if r.get('优先级','') == 'P1':
        print(f"{r['ID']} | {r.get('维度','')} | {r.get('用例标题','')[:80]}")
print()

# P2 cases
print("=== P2 Design cases (30) ===")
for r in design_rows:
    if r.get('优先级','') == 'P2':
        print(f"{r['ID']} | {r.get('维度','')} | {r.get('用例标题','')[:80]}")
print()

# Expanded cases
print("=== Expanded cases (39, all P1) ===")
for r in expanded_rows:
    print(f"{r['ID']} | {r.get('维度','')} | {r.get('用例标题','')[:80]}")

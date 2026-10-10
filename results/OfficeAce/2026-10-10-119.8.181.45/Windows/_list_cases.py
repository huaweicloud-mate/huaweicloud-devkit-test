# AI生成
import csv, json, os

base = os.path.dirname(os.path.abspath(__file__))
design_csv = os.path.join(base, '用例矩阵-设计级.csv')
expanded_csv = os.path.join(base, '用例矩阵-展开级.csv')

# Design level
with open(design_csv, encoding='utf-8-sig') as f:
    r = csv.DictReader(f)
    design_rows = list(r)

p0 = [x for x in design_rows if x.get('优先级','').strip() == 'P0']
p1 = [x for x in design_rows if x.get('优先级','').strip() == 'P1']
p2 = [x for x in design_rows if x.get('优先级','').strip() == 'P2']

print(f'=== 设计级: {len(design_rows)} total (P0:{len(p0)} P1:{len(p1)} P2:{len(p2)}) ===')
print('\n--- P0 ---')
for x in p0:
    print(f"{x['ID']}|{x.get('维度','')}|{x.get('标题','')[:60]}")
print('\n--- P1 ---')
for x in p1:
    print(f"{x['ID']}|{x.get('维度','')}|{x.get('标题','')[:60]}")
print('\n--- P2 ---')
for x in p2:
    print(f"{x['ID']}|{x.get('维度','')}|{x.get('标题','')[:60]}")

# Expanded level
with open(expanded_csv, encoding='utf-8-sig') as f:
    r = csv.DictReader(f)
    exp_rows = list(r)

print(f'\n=== 展开级: {len(exp_rows)} total ===')
for x in exp_rows:
    print(f"{x['ID']}|{x.get('优先级','')}|{x.get('维度','')}|{x.get('标题','')[:60]}")

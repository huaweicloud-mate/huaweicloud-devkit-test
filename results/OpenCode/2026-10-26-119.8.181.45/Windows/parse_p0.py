import csv, os
base = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
# Print P0 cases
print('=== P0 Design Cases ===')
for r in rows:
    if r.get('优先级') == 'P0':
        print(f"  {r['ID']}  {r.get('用例名称','')[:50]}  type={r.get('终端覆盖类型','')}  steps={r.get('执行要求','')[:100]}")
        print(f"    expect: {r.get('预期结果','')[:120]}")
        print()

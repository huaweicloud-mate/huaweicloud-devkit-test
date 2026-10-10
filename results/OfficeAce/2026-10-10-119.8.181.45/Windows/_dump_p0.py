# AI生成
import csv, json, os

base = os.path.dirname(os.path.abspath(__file__))
design_csv = os.path.join(base, '用例矩阵-设计级.csv')

with open(design_csv, encoding='utf-8-sig') as f:
    r = csv.DictReader(f)
    rows = list(r)

# Print headers
print('HEADERS:', list(rows[0].keys()))
print()

# Print P0 cases with full detail
p0 = [x for x in rows if x.get('优先级','').strip() == 'P0']
for x in p0:
    print(f"=== {x['ID']} (P0) ===")
    print(f"  维度: {x.get('维度','')}")
    print(f"  标题: {x.get('标题','')}")
    print(f"  前置: {x.get('前置条件','')[:100]}")
    print(f"  步骤: {x.get('执行步骤','')[:200]}")
    print(f"  预期: {x.get('预期结果','')[:200]}")
    print(f"  关联工具: {x.get('关联工具','')[:100]}")
    print()

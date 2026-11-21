import csv
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-22-119.8.181.45\Windows"
rows = list(csv.DictReader(open(base + r'\用例矩阵-设计级.csv', encoding='utf-8-sig')))
p0 = [r for r in rows if r['优先级'] == 'P0']
with open(base + r'\_p0_list.txt', 'w', encoding='utf-8') as out:
    for r in p0:
        out.write(f"{r['ID']} | {r['维度']} | {r['标题']} | {r['关联工具']}\n")
        out.write(f"    前置: {r['前置条件'][:100]}\n")
        out.write(f"    步骤: {r['操作步骤'][:150]}\n")
        out.write(f"    预期: {r['预期结果'][:150]}\n")
        out.write(f"    工具: {r['关联工具']} | 证据: {r['requiredEvidence'][:60]} | 依赖: {r['依赖']}\n")
print('P0 count:', len(p0))

import csv, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-27-119.8.181.45\Windows"
rows = list(csv.DictReader(open(base + r"\用例矩阵-设计级.csv", encoding='utf-8-sig')))
print("=== P0 设计级 ===")
for r in rows:
    if r['优先级'] == 'P0':
        print(f"{r['ID']} | {r['维度']} | {r['标题']}")
print()
rows2 = list(csv.DictReader(open(base + r"\用例矩阵-展开级.csv", encoding='utf-8-sig')))
print("=== 展开级全部 ===")
for r in rows2:
    print(f"{r['expandedCaseId']} | P{r['优先级']} | {r['维度']} | {r['标题'][:60]}")

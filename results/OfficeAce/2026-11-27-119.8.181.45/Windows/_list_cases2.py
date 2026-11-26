import csv, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-27-119.8.181.45\Windows"
rows2 = list(csv.DictReader(open(base + r"\用例矩阵-展开级.csv", encoding='utf-8-sig')))
print("=== 展开级全部 ===")
for r in rows2:
    t = (r.get('执行要点') or '')[:55]
    print(f"{r['expandedCaseId']} | {r['优先级']} | src={r['源用例']} | {t}")

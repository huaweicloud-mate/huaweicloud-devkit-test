import csv, io, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-18-119.8.181.45\Windows'
rows = list(csv.DictReader(io.open(base + r'\用例矩阵-设计级.csv', encoding='utf-8-sig')))
for r in rows:
    print(f"{r['ID']}|{r['优先级']}|{r['维度']}|{r['标题']}|agent={r['agent']}|req={r['requiredEvidence']}")

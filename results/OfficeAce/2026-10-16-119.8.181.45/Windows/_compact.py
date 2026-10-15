# -*- coding: utf-8 -*-
import csv, io, os, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'

rows = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-设计级.csv'), encoding='utf-8-sig')))
for r in rows:
    print(f"{r['ID']}\t{r['优先级']}\t{r['维度']}\t{r['标题']}\t工具={r['关联工具']}\t覆盖={r['终端覆盖类型']}")

print('==== EXPANDED ====')
rows2 = list(csv.DictReader(io.open(os.path.join(base, '用例矩阵-展开级.csv'), encoding='utf-8-sig')))
for r in rows2:
    print(f"{r['ID']}\t{r['优先级']}\t{r['展开类型']}\t{r['源用例']}\t{r['执行要点'][:80]}")
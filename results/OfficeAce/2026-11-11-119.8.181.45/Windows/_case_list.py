# -*- coding: utf-8 -*-
import csv, io, os
from collections import Counter
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
out = io.open(os.path.join(d, "_case_list.txt"), "w", encoding="utf-8")
for f in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv", "使命-mission-001.csv"]:
    rows = list(csv.DictReader(io.open(os.path.join(d, f), encoding="utf-8-sig")))
    out.write("======== %s (%d) ========\n" % (f, len(rows)))
    for r in rows:
        out.write("%s | P=%s | %s | %s\n" % (r.get("ID"), r.get("优先级"), (r.get("标题") or r.get("展开类型") or "")[:60], (r.get("预期结果") or "")[:50]))
out.close()
# summary
for f in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv", "使命-mission-001.csv"]:
    rows = list(csv.DictReader(io.open(os.path.join(d, f), encoding="utf-8-sig")))
    print(f, len(rows), dict(Counter(r.get("优先级", "") for r in rows)))
ids_d = [r["ID"] for r in csv.DictReader(io.open(os.path.join(d, "用例矩阵-设计级.csv"), encoding="utf-8-sig"))]
ids_e = [r["ID"] for r in csv.DictReader(io.open(os.path.join(d, "用例矩阵-展开级.csv"), encoding="utf-8-sig"))]
print("design IDs:", " ".join(ids_d))
print()
print("expanded IDs:", " ".join(ids_e))

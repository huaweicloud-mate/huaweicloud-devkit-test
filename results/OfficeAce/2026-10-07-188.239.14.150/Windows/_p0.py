# -*- coding: utf-8 -*-
import csv, os
BASE = "."
out = open("_p0.txt","w",encoding="utf-8")
for fn in ["用例矩阵-设计级.csv","用例矩阵-展开级.csv"]:
    rows = list(csv.DictReader(open(fn,encoding="utf-8-sig")))
    out.write("="*20+fn+"\n")
    for r in rows:
        if (r.get("优先级") or "").strip() == "P0":
            out.write("%s | %s | %s | %s\n" % (r.get("ID"), r.get("执行状态") or "EMPTY", r.get("维度") or "", r.get("标题") or ""))
out.close(); print("done")
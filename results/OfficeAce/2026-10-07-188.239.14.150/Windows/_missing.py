# -*- coding: utf-8 -*-
import csv, os, glob
BASE = "."
ev_dirs = set()
for d in os.listdir(os.path.join(BASE, "evidence")):
    if os.path.isdir(os.path.join(BASE, "evidence", d)):
        ev_dirs.add(d)

for fn, idcol in [("用例矩阵-设计级.csv","ID"), ("用例矩阵-展开级.csv","ID")]:
    rows = list(csv.DictReader(open(fn, encoding="utf-8-sig")))
    missing = []
    for r in rows:
        cid = (r.get(idcol) or "").strip()
        st = (r.get("执行状态") or "").strip()
        if not st:
            missing.append(cid)
    print(fn, "total", len(rows), "empty", len(missing))
    print("  empty:", missing)
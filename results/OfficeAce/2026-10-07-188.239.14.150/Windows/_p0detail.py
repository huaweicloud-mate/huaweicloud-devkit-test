# -*- coding: utf-8 -*-
import csv
for fn in ["用例矩阵-设计级.csv","用例矩阵-展开级.csv"]:
    rows = list(csv.DictReader(open(fn, encoding="utf-8-sig")))
    for r in rows:
        rid = (r.get("ID") or "").strip()
        if rid in ("D4-28","D9-12","D9-13","EXP-D5-7-1","EXP-D5-7-3"):
            print("="*8, fn, rid, "P", r.get("优先级"), "状态", r.get("执行状态"))
            for k, v in r.items():
                if v and k not in ("执行状态","执行时间","evidencePath","blockedReason"):
                    print("   %s: %s" % (k, str(v)[:350]))
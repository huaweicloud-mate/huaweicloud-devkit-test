# -*- coding: utf-8 -*-
import csv, os
BASE = os.path.dirname(os.path.abspath(__file__))
ids = ["D1-65","D1-66","D1-67","D1-68","D1-69","D1-70","D2-27","D3-C13","D3-C14","D3-S1","D3-S2","D3-S3","D3-S4","D3-S5","D3-S6","D3-S7","D3-S8","D4-25","D4-26","D4-28","D4-29","D6-9","D8-9","D8-10","D9-10","D9-11","D9-12","D9-13"]
with open(os.path.join(BASE,"_empty_detail.txt"),"w",encoding="utf-8") as out:
    for fn in ["用例矩阵-设计级.csv","用例矩阵-展开级.csv"]:
        p = os.path.join(BASE, fn)
        rows = list(csv.DictReader(open(p, encoding="utf-8-sig")))
        out.write("="*30 + fn + "\n")
        for r in rows:
            if r.get("ID") in ids or r.get("ID") in ("EXP-D5-7-1","EXP-D5-7-3"):
                out.write("--- "+r.get("ID")+" | P"+r.get("优先级")+" | "+r.get("维度")+" | "+r.get("标题")+"\n")
                for k in r.keys():
                    v = r.get(k)
                    if v and k not in ("执行状态","执行时间","evidencePath","blockedReason"):
                        out.write("    %s: %s\n" % (k, v))
print("done")
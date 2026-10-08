# -*- coding: utf-8 -*-
import csv, os
BASE = os.path.dirname(os.path.abspath(__file__))
for fn, ids in [("用例矩阵-设计级.csv", ["D1-65","D1-66","D1-67","D1-68","D1-69","D1-70","D2-27","D3-C13","D3-C14","D3-S1","D3-S2","D3-S3","D3-S4","D3-S5","D3-S6","D3-S7","D3-S8","D4-25","D4-26","D4-28","D4-29","D6-9","D8-9","D8-10","D9-10","D9-11","D9-12","D9-13"]),
                ("用例矩阵-展开级.csv", ["EXP-D5-7-1","EXP-D5-7-3"])]:
    p = os.path.join(BASE, fn)
    rows = list(csv.DictReader(open(p, encoding="utf-8-sig")))
    print("="*20, fn)
    for r in rows:
        if r.get("ID") in ids:
            print("---", r.get("ID"), "| P", r.get("优先级"), "|", r.get("维度"), "|", r.get("标题"))
            # print step/expect keys if present
            for k in ("前置条件","测试步骤","预期结果","断言","展开类型","OS","agent"):
                v = r.get(k)
                if v:
                    print("   ", k, ":", v[:220])
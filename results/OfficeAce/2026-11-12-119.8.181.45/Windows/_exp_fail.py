# -*- coding: utf-8 -*-
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
os.chdir(base)
rows2 = list(csv.DictReader(open("用例矩阵-展开级.csv", encoding="utf-8-sig")))
for r in rows2:
    if r.get("执行状态") == "FAIL":
        print("=====", r.get("ID"))
        for k, v in r.items():
            if v and k not in ("执行状态",):
                print(" ", k, "=", v[:250])

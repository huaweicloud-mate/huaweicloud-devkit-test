# -*- coding: utf-8 -*-
import csv, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
rows = list(csv.DictReader(open(base + r"\用例矩阵-设计级.csv", encoding="utf-8-sig")))
for r in rows:
    if r["ID"] in ("D4-3", "D2-4", "EXP-E01"):
        print("=====", r["ID"], r["标题"])
        for k in ("优先级", "预期结果", "测试数据", "操作步骤", "requiredEvidence", "blockedReason"):
            print(" ", k, "=", r.get(k, "")[:400])

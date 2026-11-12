# -*- coding: utf-8 -*-
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
os.chdir(base)
# --- design CSV: list BLOCKED reasons
rows = list(csv.DictReader(open("用例矩阵-设计级.csv", encoding="utf-8-sig")))
for r in rows:
    if r["执行状态"] == "BLOCKED":
        print("DESIGN", r["ID"], r["优先级"], "|", r["blockedReason"][:220])
# --- expanded CSV
rows2 = list(csv.DictReader(open("用例矩阵-展开级.csv", encoding="utf-8-sig")))
print("EXP cols:", list(rows2[0].keys()))
for r in rows2:
    if r.get("执行状态") == "FAIL":
        print("EXP", r.get("ID"), r.get("优先级"), "|", (r.get("标题") or "")[:80], "|", (r.get("blockedReason") or "")[:150])

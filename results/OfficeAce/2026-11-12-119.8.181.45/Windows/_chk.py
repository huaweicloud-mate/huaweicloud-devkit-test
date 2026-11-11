# -*- coding: utf-8 -*-
import csv, os, sys, io
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
os.chdir(base)
from collections import Counter
for f in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv", "需求-设计-证据追踪表.csv"]:
    if not os.path.exists(f):
        print("MISSING FILE", f); continue
    rows = list(csv.reader(open(f, encoding="utf-8-sig")))
    hdr = rows[0]
    print("==", f, "rows", len(rows) - 1)
    si = [i for i, h in enumerate(hdr) if "执行状态" in h]
    ei = [i for i, h in enumerate(hdr) if "执行时间" in h]
    vi = [i for i, h in enumerate(hdr) if "evidencePath" in h]
    print("status col", si, "time col", ei, "ev col", vi)
    if si:
        s = si[0]
        print(Counter((r[s] if len(r) > s else "") for r in rows[1:]))
        empt = [r[0] for r in rows[1:] if len(r) <= s or not r[s]]
        print("empty status:", empt[:20])
print()
for d in ["D2-4", "D4-3", "EXP-E01", "EXP-D5-7-3"]:
    p = os.path.join(base, "evidence", d)
    print("==", d, os.listdir(p) if os.path.isdir(p) else "MISSING")
    try:
        print(open(os.path.join(p, "stdout.log"), encoding="utf-8", errors="replace").read()[:700])
    except Exception as e:
        print(e)

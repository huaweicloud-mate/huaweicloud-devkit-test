# -*- coding: utf-8 -*-
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
os.chdir(base)
from collections import Counter
for f in ["用例矩阵-设计级.csv", "用例矩阵-展开级.csv"]:
    rows = list(csv.reader(open(f, encoding="utf-8-sig")))
    hdr = rows[0]
    s = [i for i, h in enumerate(hdr) if "执行状态" in h][0]
    print("==", f, Counter(r[s] for r in rows[1:]))
    print("P0 statuses:")
    pi = [i for i, h in enumerate(hdr) if h.strip() in ("优先级", "P级", "priority")]
    ai = [i for i, h in enumerate(hdr) if "用例ID" in h or h.strip() == "ID" or "用例编号" in h]
    print("prio cols", pi, "id cols", ai)
    if pi:
        p = pi[0]
        bad = [(r[ai[0]] if ai else "?", r[s]) for r in rows[1:] if r[p].strip().upper().startswith("P0") and r[s] in ("NOT_RUN", "")]
        print("P0 bad:", bad[:20], "count", len(bad))
# tracking csv header
rows = list(csv.reader(open("需求-设计-证据追踪表.csv", encoding="utf-8-sig")))
print("TRACK hdr:", rows[0])
print("TRACK row1:", rows[1])

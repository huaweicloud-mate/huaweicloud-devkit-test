# -*- coding: utf-8 -*-
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
os.chdir(base)
for fname, key in (("用例矩阵-设计级.csv", "D2-4"), ("用例矩阵-设计级.csv", "D4-3")):
    fn = fname
    rows = list(csv.reader(open(fn, encoding="utf-8-sig")))
    hdr = rows[0]
    idc = hdr.index("ID")
    stc = hdr.index("执行状态")
    etc = hdr.index("执行时间")
    epc = hdr.index("evidencePath")
    brc = hdr.index("blockedReason")
    for r in rows[1:]:
        if r[idc] == key:
            print(key, "before:", r[stc], r[etc], r[epc][:80], r[brc][:60])
            r[stc] = "FAIL"
            r[etc] = "20261112070000"
            r[epc] = "evidence/%s/stdout.log" % key
            r[brc] = ""
            print(key, "after :", r[stc], r[etc], r[epc])
    with open(fn, "w", newline="", encoding="utf-8-sig") as f:
        csv.writer(f).writerows(rows)
print("csv updated")

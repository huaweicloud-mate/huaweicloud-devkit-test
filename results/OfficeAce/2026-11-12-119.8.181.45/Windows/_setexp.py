# -*- coding: utf-8 -*-
import csv, os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
os.chdir(base)
rows = list(csv.DictReader(open("用例矩阵-展开级.csv", encoding="utf-8-sig")))
hdr = rows and list(rows[0].keys())
fn = "用例矩阵-展开级.csv"
raw = list(csv.reader(open(fn, encoding="utf-8-sig")))
hdr = raw[0]
idc = hdr.index("ID")
stc = hdr.index("执行状态")
etc = hdr.index("执行时间")
epc = hdr.index("evidencePath")
brc = hdr.index("blockedReason")
for r in raw[1:]:
    if r[idc] == "EXP-D5-7-3":
        r[stc] = "PASS"
        r[etc] = "20261112071000"
        r[epc] = "evidence/EXP-D5-7-3/stdout.log"
        r[brc] = ""
    elif r[idc] == "EXP-E01":
        r[stc] = "FAIL"
        r[etc] = "20261112071000"
        r[epc] = "evidence/EXP-E01/stdout.log"
        r[brc] = ""
with open(fn, "w", newline="", encoding="utf-8-sig") as f:
    csv.writer(f).writerows(raw)
print("expanded csv updated: EXP-D5-7-3 -> PASS (46 tools verified), EXP-E01 -> FAIL (routing MISS kept)")

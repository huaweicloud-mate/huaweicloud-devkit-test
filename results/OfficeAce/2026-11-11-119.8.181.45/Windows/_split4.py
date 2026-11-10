# -*- coding: utf-8 -*-
import io
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
s = io.open(d + r"\_expanded_full.txt", encoding="utf-8").read()
segs = s.split("### ")
want = {"EXP-C4-11","EXP-C4-12","EXP-C4-13","EXP-C4-14","EXP-C4-15","EXP-C4-16","EXP-C4-17","EXP-C4-18","EXP-C4-19","EXP-C4-20","EXP-C4-21","EXP-C4-22","EXP-E01","EXP-E02","EXP-E03","EXP-E04","EXP-E05","EXP-E06","EXP-E07","EXP-E08","EXP-E13","EXP-E14","EXP-E15"}
out = io.open(d + r"\_exp_rest.txt", "w", encoding="utf-8")
for seg in segs:
    cid = seg.split(" |")[0]
    if cid in want:
        out.write("### " + seg[:400] + "\n")
out.close()
print("ok")

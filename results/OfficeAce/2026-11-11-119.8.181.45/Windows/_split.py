# -*- coding: utf-8 -*-
import io
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
s = io.open(d + r"\_design_full.txt", encoding="utf-8").read()
segs = s.split("### ")
out = io.open(d + r"\_design_tail.txt", "w", encoding="utf-8")
for seg in segs[74:]:
    out.write("### " + seg + "\n")
out.close()
e = io.open(d + r"\_expanded_full.txt", encoding="utf-8").read()
out = io.open(d + r"\_expanded_head.txt", "w", encoding="utf-8")
for seg in e.split("### ")[1:20]:
    out.write("### " + seg + "\n")
out.close()
print("ok")

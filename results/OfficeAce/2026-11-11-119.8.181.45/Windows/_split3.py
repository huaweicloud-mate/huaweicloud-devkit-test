# -*- coding: utf-8 -*-
import io
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
s = io.open(d + r"\_design_mid.txt", encoding="utf-8").read()
segs = s.split("### ")
out = io.open(d + r"\_design_mid2.txt", "w", encoding="utf-8")
for seg in segs:
    cid = seg.split(" |")[0].strip()
    if cid in ("D9-10", "D9-11", "D9-12", "D9-13"):
        out.write("### " + seg + "\n")
out.close()
print("ok")

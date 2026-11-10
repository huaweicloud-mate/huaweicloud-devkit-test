# -*- coding: utf-8 -*-
import io, re
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
s = io.open(d + r"\_design_full.txt", encoding="utf-8").read()
segs = s.split("### ")
want = ["D4-29","D5-1","D5-3","D6-1","D6-3","D6-4","D6-9","D8-1","D8-4","D8-6","D8-7","D8-9","D8-10","D9-9","D9-10","D9-11","D9-12","D9-13"]
out = io.open(d + r"\_design_mid.txt", "w", encoding="utf-8")
for seg in segs:
    cid = seg.split(" |")[0].strip()
    if cid in want:
        out.write("### " + seg + "\n")
out.close()
m = io.open(d + r"\_mission_full.txt", encoding="utf-8").read()
out = io.open(d + r"\_mission_view.txt", "w", encoding="utf-8")
out.write(m)
out.close()
print("ok")

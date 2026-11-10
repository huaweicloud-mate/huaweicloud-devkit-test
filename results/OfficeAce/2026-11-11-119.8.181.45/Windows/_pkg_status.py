# -*- coding: utf-8 -*-
import os, sys, csv, io
from collections import Counter
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows"
out = io.open(r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows\_pkg_status.txt", "w", encoding="utf-8")
for f in sorted(os.listdir(d)):
    if f.endswith(".csv"):
        rows = list(csv.reader(io.open(os.path.join(d, f), encoding="utf-8-sig")))
        out.write("== %s rows=%d\n" % (f, len(rows) - 1))
        hdr = rows[0]
        out.write("   header: %s\n" % ",".join(hdr))
        for name in ["执行状态", "执行时间", "evidencePath", "blockedReason"]:
            if name in hdr:
                i = hdr.index(name)
                c = Counter((r[i] if i < len(r) and r[i] else "(空)") for r in rows[1:])
                out.write("   %s: %s\n" % (name, dict(c)))
out.close()
print("done")

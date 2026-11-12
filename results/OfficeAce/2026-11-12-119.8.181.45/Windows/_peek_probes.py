# -*- coding: utf-8 -*-
import os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows"
for d in ["D2-4", "D4-3"]:
    print("=====", d)
    p = os.path.join(base, "evidence", d, "probe.mjs")
    print(open(p, encoding="utf-8", errors="replace").read()[:3000])

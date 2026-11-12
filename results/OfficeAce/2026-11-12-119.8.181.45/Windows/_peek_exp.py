# -*- coding: utf-8 -*-
import os, sys
sys.stdout.reconfigure(encoding="utf-8")
base = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-12-119.8.181.45\Windows\evidence"
for d in ["EXP-D5-7-3", "EXP-E01"]:
    print("=====", d)
    p = os.path.join(base, d)
    if not os.path.isdir(p):
        print("  (missing dir)")
        continue
    for fn in os.listdir(p):
        fp = os.path.join(p, fn)
        print("  --", fn)
        try:
            t = open(fp, encoding="utf-8", errors="replace").read()
            print(t[:1500])
        except Exception as e:
            print("   read err", e)

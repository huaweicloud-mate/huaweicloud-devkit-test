# -*- coding: utf-8 -*-
import os, sys
sys.stdout.reconfigure(encoding="utf-8")
root = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\test-cases"
for dirpath, dirnames, filenames in os.walk(root):
    for fn in filenames:
        p = os.path.join(dirpath, fn)
        try:
            t = open(p, encoding="utf-8", errors="replace").read()
        except Exception:
            continue
        if "D4-3" in t:
            print("FILE:", p)
            idx = 0
            while True:
                i = t.find("D4-3", idx)
                if i < 0:
                    break
                print("---- ctx:")
                print(t[max(0, i - 400): i + 1200])
                idx = i + 1
                break  # first occurrence per file is enough

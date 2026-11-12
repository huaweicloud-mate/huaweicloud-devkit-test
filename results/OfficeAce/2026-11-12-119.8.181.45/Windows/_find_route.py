# -*- coding: utf-8 -*-
import os, re, sys
sys.stdout.reconfigure(encoding="utf-8")
root = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core"
needle = "Run hcloud --help"
for dirpath, dirnames, filenames in os.walk(root):
    if "node_modules" in dirpath:
        continue
    for fn in filenames:
        if not fn.endswith((".mjs", ".json", ".cjs")):
            continue
        p = os.path.join(dirpath, fn)
        try:
            t = open(p, encoding="utf-8", errors="replace").read()
        except Exception:
            continue
        if needle in t:
            i = t.find(needle)
            ln = t.count("\n", 0, i) + 1
            print("FILE:", p, "line~", ln)
            print(t[max(0, i - 600): i + 200])

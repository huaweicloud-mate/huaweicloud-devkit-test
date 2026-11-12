# -*- coding: utf-8 -*-
import os, re, sys
sys.stdout.reconfigure(encoding="utf-8")
root = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src"
# find the serviceCatalog / routing table: search for 云主机 / ECS keywords in routing logic
for fn in os.listdir(root):
    if not fn.endswith(".mjs"):
        continue
    p = os.path.join(root, fn)
    t = open(p, encoding="utf-8", errors="replace").read()
    for kw in ["云主机", "弹性云服务器", "serviceCatalog", "ECS查询"]:
        for m in re.finditer(re.escape(kw), t):
            i = m.start()
            ln = t.count("\n", 0, i) + 1
            print(fn, "|", kw, "| line", ln, "|", t[max(0, i - 80): i + 120].replace("\n", " ")[:200])

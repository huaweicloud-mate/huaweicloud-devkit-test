# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\safety-policy.mjs"
lines = open(p, encoding="utf-8").read().splitlines()
print("total", len(lines))
pat = re.compile(r"ak|sk|secret|accesskey|redact", re.I)
hits = 0
for i, l in enumerate(lines, 1):
    if pat.search(l):
        hits += 1
        if hits <= 60:
            print(i, l.strip()[:170])
print("hits", hits)

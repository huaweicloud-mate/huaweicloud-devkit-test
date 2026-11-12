# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\risk-rule-engine.mjs"
lines = open(p, encoding="utf-8").read().splitlines()
print("total", len(lines))
pat = re.compile(r"secret|kms|decrypt|credential|plaintext", re.I)
for i, l in enumerate(lines, 1):
    if pat.search(l):
        print(i, l.strip()[:180])

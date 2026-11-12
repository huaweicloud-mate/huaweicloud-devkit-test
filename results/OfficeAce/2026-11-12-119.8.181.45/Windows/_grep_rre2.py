# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\risk-rule-engine.mjs"
lines = open(p, encoding="utf-8").read().splitlines()
for i in range(1, 70):
    print(i, lines[i - 1])

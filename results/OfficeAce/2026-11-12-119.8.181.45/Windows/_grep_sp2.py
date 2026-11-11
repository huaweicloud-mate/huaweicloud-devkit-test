# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\safety-policy.mjs"
lines = open(p, encoding="utf-8").read().splitlines()
for i in range(33, 66):
    print(i, lines[i - 1])

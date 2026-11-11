# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\safety-policy.mjs"
src = open(p, encoding="utf-8").read()
for m in re.finditer(r"export (?:async )?function (\w+)|export const (\w+)", src):
    print(m.group(1) or m.group(2))

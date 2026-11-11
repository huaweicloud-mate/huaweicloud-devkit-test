# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding="utf-8")
t = open(r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\skills\test-execution\SKILL.md", encoding="utf-8").read()
i = t.find("### 4")
print(t[i:i+7000])

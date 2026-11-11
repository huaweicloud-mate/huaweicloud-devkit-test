# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding="utf-8")
p = r"C:\Users\Administrator\devkit-test\OfficeAce\hdk\plugins\huaweicloud-core\src\tools.mjs"
lines = open(p, encoding="utf-8").read().splitlines()
# print the ECS routeMap entry and around the helper that picks services
print("\n".join("%d %s" % (i + 1, l) for i, l in enumerate(lines[2318:2350])))

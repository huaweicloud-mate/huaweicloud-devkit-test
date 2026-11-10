# -*- coding: utf-8 -*-
import io, re, os
d = r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\src"
out = io.open(r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows\_doctor_ctx.txt", "w", encoding="utf-8")
for f in os.listdir(d):
    if not f.endswith(".mjs"):
        continue
    s = io.open(os.path.join(d, f), encoding="utf-8").read()
    m = re.search(r"Hermes MCP Python SDK", s)
    if m:
        out.write("FILE %s idx %d\n" % (f, m.start()))
        out.write(s[max(0, m.start() - 1200):m.start() + 600] + "\n\n")
out.close()
print("ok")

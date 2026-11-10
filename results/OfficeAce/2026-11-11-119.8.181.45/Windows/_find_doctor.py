# -*- coding: utf-8 -*-
import io, re
p = r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\bin\setup.cjs"
s = io.open(p, encoding="utf-8").read()
print("len", len(s))
for kw in ["Hermes MCP Python SDK", "checkHermes", "hermes"]:
    for m in re.finditer(re.escape(kw), s):
        print("KW", kw, "at", m.start())

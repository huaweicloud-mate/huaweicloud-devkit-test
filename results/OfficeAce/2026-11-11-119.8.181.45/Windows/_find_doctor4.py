# -*- coding: utf-8 -*-
import io
d = r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\src"
s = io.open(d + r"\setup-cli.mjs", encoding="utf-8").read()
out = io.open(r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows\_doctor_ctx2.txt", "w", encoding="utf-8")
for kw in ["check('MCP server can start", "check('MCP configured", "Skills installed", "hermesMcpSdkOk", "function check("]:
    i = s.find(kw)
    if i < 0:
        i = s.find(kw.replace("'", "\""))
    out.write("=== %s @ %d ===\n%s\n\n" % (kw, i, s[max(0, i - 500):i + 500] if i >= 0 else "NOT FOUND"))
out.close()
print("ok")

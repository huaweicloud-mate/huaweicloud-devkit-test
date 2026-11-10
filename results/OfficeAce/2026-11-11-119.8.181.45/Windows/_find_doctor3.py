# -*- coding: utf-8 -*-
import io, re
d = r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\src"
s = io.open(d + r"\setup-cli.mjs", encoding="utf-8").read()
# 找 doctor 检查项注册
for kw in ["Hermes MCP Python SDK\"", "Hermes MCP", "doctorChecks", "function doctor", "async function doctor", "'Doctor'"]:
    for m in re.finditer(re.escape(kw), s):
        print("KW", kw, "at", m.start())
# 打印包含 Hermes 的 doctor 相关行
for m in re.finditer(r".*Hermes.*", s):
    line = m.group(0)
    if "doctor" in line.lower() or "check" in line.lower() or "SDK" in line:
        print("LINE:", line[:200])

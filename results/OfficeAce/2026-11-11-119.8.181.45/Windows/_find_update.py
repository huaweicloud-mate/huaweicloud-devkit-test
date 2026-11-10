# -*- coding: utf-8 -*-
import io, re
d = r"C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-3\node_modules\huaweicloud-devkit\plugins\huaweicloud-core\src"
s = io.open(d + r"\setup-cli.mjs", encoding="utf-8").read()
out = io.open(r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows\_update_ctx.txt", "w", encoding="utf-8")
for kw in ["--channel", "channel", "check-update", "--check"]:
    idxs = [m.start() for m in re.finditer(re.escape(kw), s)][:6]
    out.write("KW %s -> %s\n" % (kw, idxs))
out.close()
print("ok")

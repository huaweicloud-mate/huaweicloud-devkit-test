# -*- coding: utf-8 -*-
import io
d = r"C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-11-119.8.181.45\Windows\evidence\D1-4"
s = io.open(d + r"\step1_help.log", encoding="utf-8", errors="replace").read()
i = s.find("=== update --help ===")
out = io.open(d + r"\_update_help.txt", "w", encoding="utf-8")
out.write(s[i:i+1500] if i >= 0 else "NOT FOUND")
out.close()
print("ok")

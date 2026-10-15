# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-10-16-119.8.181.45\Windows'
s = io.open(base + '\\_full_cases.txt', encoding='utf-8').read()
a = int(sys.argv[1]); b = int(sys.argv[2])
print(s[a:b])
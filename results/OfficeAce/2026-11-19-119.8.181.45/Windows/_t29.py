# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
t = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\AGENTS.md', encoding='utf-8', errors='replace').read()
open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-19-119.8.181.45\Windows\_agents2.txt', 'w', encoding='utf-8').write(t[3300:8200])
print('ok', len(t))

# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
t = open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-19-119.8.181.45\Windows\_t26.txt', encoding='utf-8', errors='replace').read()
out = t[:5200]
open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-19-119.8.181.45\Windows\_d3s_section.txt', 'w', encoding='utf-8').write(out)
print('written', len(out))

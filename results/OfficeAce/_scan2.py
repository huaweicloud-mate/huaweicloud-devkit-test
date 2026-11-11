# -*- coding: utf-8 -*-
import os, sys, io, csv
sys.stdout.reconfigure(encoding='utf-8')
base = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\2026-11-08-119.8.181.45\Windows'
p = os.path.join(base, 'OfficeAce-testbot4-测试报告.md')
if os.path.exists(p):
    t = io.open(p, encoding='utf-8').read()
    print(len(t))
    io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_rep08.txt', 'w', encoding='utf-8').write(t[:3500])
    print('written')
else:
    print('missing report')

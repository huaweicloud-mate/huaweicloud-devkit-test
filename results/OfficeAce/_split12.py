# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\realcloud_e2e.mjs'
t = io.open(p, encoding='utf-8', errors='replace').read()
lines = t.splitlines()
print('lines', len(lines))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_rce_head.txt','w',encoding='utf-8').write('\n'.join(lines[:100]))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_rce_mid.txt','w',encoding='utf-8').write('\n'.join(lines[100:260]))
print('ok')

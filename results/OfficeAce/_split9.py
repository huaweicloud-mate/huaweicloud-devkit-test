# -*- coding: utf-8 -*-
import io, sys
sys.stdout.reconfigure(encoding='utf-8')
p = r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\scripts\_batch_runner_officeace_20261107.mjs'
t = io.open(p, encoding='utf-8', errors='replace').read()
lines = t.splitlines()
print('total lines', len(lines))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_br_head.txt','w',encoding='utf-8').write('\n'.join(lines[:150]))
io.open(r'C:\Users\Administrator\devkit-test\OfficeAce\huaweicloud-devkit-test\results\OfficeAce\_br_tail.txt','w',encoding='utf-8').write('\n'.join(lines[-120:]))
print('ok')
